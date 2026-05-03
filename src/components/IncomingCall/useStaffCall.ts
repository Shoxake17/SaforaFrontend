// src/components/IncomingCall/useStaffCall.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getCallStatus,
  answerCall,
  sendIceCandidates,
  endCall,
  staffReconnectCall,
} from '@services/calls';
import type { ICECandidate } from '@services/calls';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:80?transport=tcp',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
  {
    urls: 'turns:a.relay.metered.ca:443',
    username: '72bca145595f1ddb5ebf4257',
    credential: 'a9f+0iK5TMpNMAXx',
  },
];

const POLL_INTERVAL_MS = 2000;
const ICE_FLUSH_DELAY_MS = 500;
const DISCONNECT_GRACE_MS = 15000;

const STORAGE_KEY = 'safora_staff_active_call';
const RECONNECT_TIMEOUT_MS = 60000;

export type StaffCallStatus =
  | 'idle'
  | 'accepting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

interface UseStaffCallResult {
  status: StaffCallStatus;
  errorMessage: string;
  acceptCall: (callId: string) => Promise<void>;
  hangUp: () => void;
  pendingReconnectCallId: string | null;
}

interface StoredStaffCall {
  callId: string;
  startedAt: number;
}

interface UseStaffCallParams {
  onEnded?: () => void;
}

export function useStaffCall(
  params: UseStaffCallParams = {}
): UseStaffCallResult {
  const { onEnded } = params;

  const [status, setStatus] = useState<StaffCallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pendingReconnectCallId, setPendingReconnectCallId] = useState<string | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const iceFlushTimerRef = useRef<number | null>(null);
  const disconnectTimerRef = useRef<number | null>(null);
  const pendingIceRef = useRef<ICECandidate[]>([]);
  const addedGuestIceCountRef = useRef<number>(0);
  const acceptingRef = useRef<boolean>(false);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // ═══════════════════════════════════════════════════
  // STORAGE helpers
  // ═══════════════════════════════════════════════════
  const saveToStorage = useCallback((callId: string) => {
    try {
      const data: StoredStaffCall = { callId, startedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const removeFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const getStoredCall = useCallback((): StoredStaffCall | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as StoredStaffCall;
      if (Date.now() - data.startedAt > RECONNECT_TIMEOUT_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════
  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (iceFlushTimerRef.current) {
      clearTimeout(iceFlushTimerRef.current);
      iceFlushTimerRef.current = null;
    }
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      try {
        peerRef.current.close();
      } catch {}
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      if (remoteAudioRef.current.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
      }
      remoteAudioRef.current = null;
    }
    pendingIceRef.current = [];
    addedGuestIceCountRef.current = 0;
    acceptingRef.current = false;
  }, []);

  // ═══════════════════════════════════════════════════
  // CALL ENDED
  // ═══════════════════════════════════════════════════
  const handleCallEnded = useCallback(() => {
    setStatus('ended');
    removeFromStorage();
    setPendingReconnectCallId(null);
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      if (onEndedRef.current) onEndedRef.current();
    }, 1000);
  }, [cleanup, removeFromStorage]);

  // ═══════════════════════════════════════════════════
  // ICE flush
  // ═══════════════════════════════════════════════════
  const flushIceCandidates = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId || pendingIceRef.current.length === 0) return;
    const batch = [...pendingIceRef.current];
    pendingIceRef.current = [];
    try {
      await sendIceCandidates(callId, batch, 'staff');
    } catch (err) {
      pendingIceRef.current.unshift(...batch);
    }
  }, []);

  const queueIceFlush = useCallback(() => {
    if (iceFlushTimerRef.current) clearTimeout(iceFlushTimerRef.current);
    iceFlushTimerRef.current = window.setTimeout(
      flushIceCandidates,
      ICE_FLUSH_DELAY_MS
    );
  }, [flushIceCandidates]);

  // ═══════════════════════════════════════════════════
  // POLL
  // ═══════════════════════════════════════════════════
  const pollStatus = useCallback(async () => {
    const callId = callIdRef.current;
    const peer = peerRef.current;
    if (!callId || !peer) return;

    try {
      const data = await getCallStatus(callId);

      if (data.status === 'ended' || data.status === 'missed') {
        handleCallEnded();
        return;
      }

      if (
        data.iceGuest &&
        data.iceGuest.length > addedGuestIceCountRef.current &&
        peer.remoteDescription
      ) {
        const newCandidates = data.iceGuest.slice(addedGuestIceCountRef.current);
        for (const c of newCandidates) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch {}
        }
        addedGuestIceCountRef.current = data.iceGuest.length;
      }
    } catch {}
  }, [handleCallEnded]);

  // ═══════════════════════════════════════════════════
  // ACCEPT CALL
  // ═══════════════════════════════════════════════════
  const acceptCall = useCallback(
    async (callId: string) => {
      // GUARD 1: duplicate accept
      if (acceptingRef.current) {
        console.warn('[useStaffCall] acceptCall already in progress');
        return;
      }

      // ✅ GUARD 2: Bir xil callId — mehmon reconnect signal
      // Eski peer'ni jim yopib, yangi peer yaratamiz
      if (callIdRef.current === callId && peerRef.current) {
        console.warn(
          '[useStaffCall] callId already accepted — re-accepting (guest reconnect)'
        );
        // Eski peer'ni jim yopish (handleCallEnded chaqirilmasin)
        if (peerRef.current) {
          peerRef.current.onconnectionstatechange = null;
          peerRef.current.ontrack = null;
          peerRef.current.onicecandidate = null;
          try {
            peerRef.current.close();
          } catch {}
          peerRef.current = null;
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
          if (remoteAudioRef.current.parentNode) {
            remoteAudioRef.current.parentNode.removeChild(
              remoteAudioRef.current
            );
          }
          remoteAudioRef.current = null;
        }
        // Polling timer'ni ham bekor qilish
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        pendingIceRef.current = [];
        addedGuestIceCountRef.current = 0;
        // callIdRef.current ni saqlab qolamiz — bu yerda davom etish
      } else {
        // Yangi accept — hammasini tozalash
        cleanup();
        callIdRef.current = callId;
      }

      acceptingRef.current = true;
      setErrorMessage('');
      setStatus('accepting');

      let localPeer: RTCPeerConnection | null = null;
      let localStream: MediaStream | null = null;
      let localAudio: HTMLAudioElement | null = null;

      try {
        const callData = await getCallStatus(callId);
        if (!callData.offerSdp) {
          throw new Error('Offer SDP not found');
        }

        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        localAudio = document.createElement('audio');
        localAudio.autoplay = true;
        localAudio.setAttribute('playsinline', 'true');
        localAudio.volume = 1.0;
        document.body.appendChild(localAudio);

        localPeer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        localStream.getTracks().forEach(track => {
          if (localPeer && localStream) {
            localPeer.addTrack(track, localStream);
          }
        });

        localPeer.ontrack = ev => {
          if (localAudio && ev.streams[0]) {
            localAudio.srcObject = ev.streams[0];
            localAudio.play().catch(err => {
              console.warn('[useStaffCall] audio play failed:', err);
            });
          }
        };

        localPeer.onicecandidate = ev => {
          if (ev.candidate) {
            pendingIceRef.current.push({
              candidate: ev.candidate.candidate,
              sdpMid: ev.candidate.sdpMid,
              sdpMLineIndex: ev.candidate.sdpMLineIndex,
            });
            queueIceFlush();
          }
        };

        localPeer.onconnectionstatechange = () => {
          if (!localPeer) return;
          console.log('[useStaffCall] connectionState:', localPeer.connectionState);

          if (localPeer.connectionState === 'connected') {
            if (disconnectTimerRef.current) {
              clearTimeout(disconnectTimerRef.current);
              disconnectTimerRef.current = null;
            }
            setStatus('connected');
            saveToStorage(callId);
          } else if (localPeer.connectionState === 'disconnected') {
            if (disconnectTimerRef.current) {
              clearTimeout(disconnectTimerRef.current);
            }
            disconnectTimerRef.current = window.setTimeout(() => {
              console.warn('[useStaffCall] 15 sek disconnect — tugatilmoqda');
              handleCallEnded();
            }, DISCONNECT_GRACE_MS);
          } else if (
            localPeer.connectionState === 'failed' ||
            localPeer.connectionState === 'closed'
          ) {
            handleCallEnded();
          }
        };

        await localPeer.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(callData.offerSdp))
        );

        if (callData.iceGuest && callData.iceGuest.length > 0) {
          for (const c of callData.iceGuest) {
            try {
              await localPeer.addIceCandidate(new RTCIceCandidate(c));
            } catch {}
          }
          addedGuestIceCountRef.current = callData.iceGuest.length;
        }

        const answer = await localPeer.createAnswer();
        await localPeer.setLocalDescription(answer);

        const result = await answerCall(
          callId,
          JSON.stringify(localPeer.localDescription)
        );

        if (!result.success) {
          if (result.alreadyAnswered) {
            console.warn('[useStaffCall] alreadyAnswered — silently cleaning duplicate');
            try { localPeer.close(); } catch {}
            localStream.getTracks().forEach(t => t.stop());
            if (localAudio.parentNode) {
              localAudio.parentNode.removeChild(localAudio);
            }
            acceptingRef.current = false;
            return;
          }
          throw new Error('Failed to answer call');
        }

        peerRef.current = localPeer;
        localStreamRef.current = localStream;
        remoteAudioRef.current = localAudio;

        setStatus('connected');
        saveToStorage(callId);
        setPendingReconnectCallId(null);

        pollTimerRef.current = window.setInterval(pollStatus, POLL_INTERVAL_MS);
        acceptingRef.current = false;
      } catch (err: any) {
        console.error('[useStaffCall] acceptCall error:', err);

        if (localPeer) {
          try { localPeer.close(); } catch {}
        }
        if (localStream) {
          localStream.getTracks().forEach(t => t.stop());
        }
        if (localAudio && localAudio.parentNode) {
          localAudio.parentNode.removeChild(localAudio);
        }

        let msg = 'Could not accept call';
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          msg = 'Microphone access denied.';
        } else if (err.message) {
          msg = err.message;
        }

        setErrorMessage(msg);
        setStatus('failed');
        cleanup();

        setTimeout(() => {
          if (onEndedRef.current) onEndedRef.current();
        }, 2000);
      }
    },
    [cleanup, pollStatus, queueIceFlush, handleCallEnded, saveToStorage]
  );

  // ═══════════════════════════════════════════════════
  // MOUNT — Refresh'dan keyin reconnect kutmoq
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const stored = getStoredCall();
    if (!stored) return;

    let cancelled = false;

    const tryStaffReconnect = async () => {
      console.log(
        '[useStaffCall] Found stored call, attempting staff reconnect:',
        stored.callId
      );
      setStatus('reconnecting');

      try {
        const callData = await getCallStatus(stored.callId);
        if (cancelled) return;

        if (callData.status === 'ended' || callData.status === 'missed') {
          console.warn('[useStaffCall] Call already ended');
          removeFromStorage();
          setStatus('idle');
          return;
        }

        await staffReconnectCall(stored.callId);
        if (cancelled) return;

        setPendingReconnectCallId(stored.callId);
        console.log('[useStaffCall] Staff reconnect signal sent');
      } catch (err) {
        console.error('[useStaffCall] Staff reconnect failed:', err);
        removeFromStorage();
        setStatus('idle');
      }
    };

    tryStaffReconnect();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════
  // HANG UP
  // ═══════════════════════════════════════════════════
  const hangUp = useCallback(() => {
    const callId = callIdRef.current;
    if (callId) {
      endCall(callId).catch(() => {});
    }
    removeFromStorage();
    setPendingReconnectCallId(null);
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      if (onEndedRef.current) onEndedRef.current();
    }, 300);
  }, [cleanup, removeFromStorage]);

  // Cleanup on unmount — endCall YUBORMAYMIZ (refresh bo'lishi mumkin)
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    errorMessage,
    acceptCall,
    hangUp,
    pendingReconnectCallId,
  };
}