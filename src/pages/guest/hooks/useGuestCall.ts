// src/pages/guest/hooks/useGuestCall.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initiateCall,
  getCallStatus,
  sendIceCandidates,
  endCall,
  reconnectCall,
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

// Refresh/Reconnect uchun
const STORAGE_KEY = 'safora_active_call';
const RECONNECT_TIMEOUT_MS = 60000; // 60 sek ichida reconnect bo'lmasa, tashlash

export type GuestCallStatus =
  | 'idle'
  | 'requesting-mic'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

interface UseGuestCallParams {
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  onEnded?: () => void;
}

interface UseGuestCallResult {
  status: GuestCallStatus;
  errorMessage: string;
  startCall: () => Promise<void>;
  hangUp: () => void;
  isReconnecting: boolean;
}

interface StoredCallData {
  callId: string;
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  startedAt: number;
}

export function useGuestCall({
  hotelSlug,
  roomNumber,
  guestName,
  guestPhone,
  onEnded,
}: UseGuestCallParams): UseGuestCallResult {
  const [status, setStatus] = useState<GuestCallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const iceFlushTimerRef = useRef<number | null>(null);
  const disconnectTimerRef = useRef<number | null>(null);
  const pendingIceRef = useRef<ICECandidate[]>([]);
  const addedStaffIceCountRef = useRef(0);
  const isUnmountingRef = useRef(false);

  // ✅ Manager reconnect detect uchun
  const previousStatusRef = useRef<string | null>(null);
  const handlingManagerReconnectRef = useRef(false);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // ═══════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════
  const saveCallToStorage = useCallback(
    (callId: string) => {
      try {
        const data: StoredCallData = {
          callId,
          hotelSlug,
          roomNumber,
          guestName,
          startedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    },
    [hotelSlug, roomNumber, guestName]
  );

  const removeCallFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const getStoredCall = useCallback((): StoredCallData | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data: StoredCallData = JSON.parse(raw);

      if (Date.now() - data.startedAt > RECONNECT_TIMEOUT_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      if (
        data.hotelSlug !== hotelSlug ||
        data.roomNumber !== roomNumber ||
        data.guestName !== guestName
      ) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }, [hotelSlug, roomNumber, guestName]);

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
    addedStaffIceCountRef.current = 0;
    previousStatusRef.current = null;
    handlingManagerReconnectRef.current = false;
  }, []);

  // ═══════════════════════════════════════════════════
  // CALL ENDED
  // ═══════════════════════════════════════════════════
  const handleCallEnded = useCallback(() => {
    setStatus('ended');
    removeCallFromStorage();
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, 1500);
  }, [cleanup, removeCallFromStorage]);

  // ═══════════════════════════════════════════════════
  // ICE flush
  // ═══════════════════════════════════════════════════
  const flushIceCandidates = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId || pendingIceRef.current.length === 0) return;

    const batch = [...pendingIceRef.current];
    pendingIceRef.current = [];

    try {
      await sendIceCandidates(callId, batch, 'guest');
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
  // CREATE PEER CONNECTION (DRY — startCall + reconnect + manager-reconnect)
  // ═══════════════════════════════════════════════════
  const createPeerConnection = useCallback(async (): Promise<{
    peer: RTCPeerConnection;
    offer: string;
  }> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    localStreamRef.current = stream;

    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.setAttribute('playsinline', 'true');
    audio.volume = 1.0;
    document.body.appendChild(audio);
    remoteAudioRef.current = audio;

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = peer;

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = ev => {
      if (remoteAudioRef.current && ev.streams[0]) {
        remoteAudioRef.current.srcObject = ev.streams[0];
        remoteAudioRef.current.play().catch(err => {
          console.warn('[useGuestCall] audio play failed:', err);
        });
      }
    };

    peer.onicecandidate = ev => {
      if (ev.candidate) {
        pendingIceRef.current.push({
          candidate: ev.candidate.candidate,
          sdpMid: ev.candidate.sdpMid,
          sdpMLineIndex: ev.candidate.sdpMLineIndex,
        });
        queueIceFlush();
      }
    };

    peer.onconnectionstatechange = () => {
      console.log('[useGuestCall] connectionState:', peer.connectionState);

      if (peer.connectionState === 'connected') {
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        setStatus('connected');
        setIsReconnecting(false);
      } else if (peer.connectionState === 'disconnected') {
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
        }
        disconnectTimerRef.current = window.setTimeout(() => {
          console.warn('[useGuestCall] 15 sek disconnect — tugatilmoqda');
          handleCallEnded();
        }, DISCONNECT_GRACE_MS);
      } else if (
        peer.connectionState === 'failed' ||
        peer.connectionState === 'closed'
      ) {
        // Manager reconnect paytida bu chaqirilmasligi kerak (jim yopamiz)
        if (!handlingManagerReconnectRef.current) {
          handleCallEnded();
        }
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    return {
      peer,
      offer: JSON.stringify(peer.localDescription),
    };
  }, [queueIceFlush, handleCallEnded]);

  // ═══════════════════════════════════════════════════
  // POLL — Manager reconnect detect ham shu erda
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

      // ═══════════════════════════════════════════════════
      // ✅ MANAGER RECONNECT DETEKTOR
      // Status was 'answered' va remoteDescription bor edi → endi 'ringing'
      // Bu manager refresh qilganini bildiradi
      // ═══════════════════════════════════════════════════
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = data.status;

      if (
        previousStatus === 'answered' &&
        data.status === 'ringing' &&
        peer.remoteDescription &&
        !handlingManagerReconnectRef.current
      ) {
        console.log(
          '[useGuestCall] Manager reconnect detected — recreating peer'
        );
        handlingManagerReconnectRef.current = true;

        // Disconnect timer'ni bekor qilish
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }

        // Polling timer'ni bekor qilish (yangi peer keyin yana boshlanadi)
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        // Eski peer'ni JIM yopish (handleCallEnded chaqirilmasin)
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
        pendingIceRef.current = [];
        addedStaffIceCountRef.current = 0;

        setStatus('reconnecting');
        setIsReconnecting(true);

        try {
          // Yangi peer va offer yaratish
          const { offer } = await createPeerConnection();
          await reconnectCall(callId, offer);

          setStatus('ringing');
          previousStatusRef.current = 'ringing';

          // Polling qayta boshlash
          pollTimerRef.current = window.setInterval(
            pollStatus,
            POLL_INTERVAL_MS
          );

          console.log(
            '[useGuestCall] Guest-side reconnect successful, waiting for manager re-accept'
          );
        } catch (err) {
          console.error('[useGuestCall] Guest-side reconnect failed:', err);
          handleCallEnded();
        } finally {
          handlingManagerReconnectRef.current = false;
        }
        return;
      }

      // ═══════════════════════════════════════════════════
      // Manager Accept — answerSdp keldi
      // ═══════════════════════════════════════════════════
      if (
        data.status === 'answered' &&
        data.answerSdp &&
        peer.signalingState !== 'closed' &&
        !peer.remoteDescription
      ) {
        try {
          await peer.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.answerSdp))
          );
        } catch (err) {
          console.error('[useGuestCall] setRemoteDescription error:', err);
        }
      }

      // ═══════════════════════════════════════════════════
      // Manager ICE candidates
      // ═══════════════════════════════════════════════════
      if (
        data.iceStaff &&
        data.iceStaff.length > addedStaffIceCountRef.current &&
        peer.remoteDescription
      ) {
        const newCandidates = data.iceStaff.slice(
          addedStaffIceCountRef.current
        );
        for (const c of newCandidates) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            // ignore
          }
        }
        addedStaffIceCountRef.current = data.iceStaff.length;
      }
    } catch (err) {
      // Silent fail
    }
  }, [handleCallEnded, createPeerConnection]);

  // ═══════════════════════════════════════════════════
  // TRY RECONNECT — sahifa refresh'dan keyin
  // ═══════════════════════════════════════════════════
  const tryReconnect = useCallback(
    async (storedCallId: string): Promise<boolean> => {
      console.log('[useGuestCall] Attempting reconnect:', storedCallId);
      setIsReconnecting(true);
      setStatus('reconnecting');
      setErrorMessage('');

      try {
        // 1. Call hali tirikmi tekshirish
        const callData = await getCallStatus(storedCallId);

        if (callData.status === 'ended' || callData.status === 'missed') {
          console.warn('[useGuestCall] Call already ended — cannot reconnect');
          removeCallFromStorage();
          setIsReconnecting(false);
          return false;
        }

        callIdRef.current = storedCallId;

        // 2. Yangi peer connection
        const { offer } = await createPeerConnection();

        // 3. Backend'ga reconnect yuborish
        await reconnectCall(storedCallId, offer);

        // 4. Polling boshlash (manager qayta accept qilishi kerak)
        setStatus('ringing');
        previousStatusRef.current = 'ringing';
        pollTimerRef.current = window.setInterval(pollStatus, POLL_INTERVAL_MS);

        // Storage'ni yangilash (yangi startedAt)
        saveCallToStorage(storedCallId);

        console.log('[useGuestCall] Reconnect successful, waiting for manager');
        return true;
      } catch (err: any) {
        console.error('[useGuestCall] Reconnect failed:', err);
        removeCallFromStorage();
        setIsReconnecting(false);
        cleanup();
        return false;
      }
    },
    [
      createPeerConnection,
      pollStatus,
      cleanup,
      removeCallFromStorage,
      saveCallToStorage,
    ]
  );

  // ═══════════════════════════════════════════════════
  // START CALL
  // ═══════════════════════════════════════════════════
  const startCall = useCallback(async () => {
    // ✅ Avval localStorage'da active call bormi tekshirish
    const storedCall = getStoredCall();
    if (storedCall) {
      console.log('[useGuestCall] Found stored call, attempting reconnect');
      const reconnected = await tryReconnect(storedCall.callId);
      if (reconnected) return; // Reconnect muvaffaqiyatli
    }

    // Yangi call boshlash
    cleanup();
    callIdRef.current = null;

    setErrorMessage('');
    setStatus('requesting-mic');

    try {
      setStatus('connecting');
      const { offer } = await createPeerConnection();

      const result = await initiateCall({
        hotelSlug,
        roomNumber,
        guestName,
        guestPhone,
        offerSdp: offer,
      });

      callIdRef.current = result.callId;

      // ✅ Storage'ga saqlash
      saveCallToStorage(result.callId);

      setStatus('ringing');
      previousStatusRef.current = 'ringing';
      pollTimerRef.current = window.setInterval(pollStatus, POLL_INTERVAL_MS);
    } catch (err: any) {
      console.error('[useGuestCall] startCall error:', err);

      let msg = 'Could not start call';
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        msg =
          'Microphone access denied. Please allow microphone in browser settings.';
      } else if (err.message) {
        msg = err.message;
      }

      setErrorMessage(msg);
      setStatus('failed');
      cleanup();
    }
  }, [
    hotelSlug,
    roomNumber,
    guestName,
    guestPhone,
    cleanup,
    pollStatus,
    createPeerConnection,
    saveCallToStorage,
    getStoredCall,
    tryReconnect,
  ]);

  // ═══════════════════════════════════════════════════
  // HANG UP
  // ═══════════════════════════════════════════════════
  const hangUp = useCallback(() => {
    const callId = callIdRef.current;
    if (callId) {
      endCall(callId).catch(() => {});
    }
    removeCallFromStorage();
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, 300);
  }, [cleanup, removeCallFromStorage]);

  // ═══════════════════════════════════════════════════
  // beforeunload — tab yopilganda
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const handleBeforeUnload = () => {
      const callId = callIdRef.current;
      if (!callId) return;

      // Connected paytida — storage'da qoldiramiz (reconnect uchun)
      // Faqat ringing/connecting paytida end yuboramiz
      if (
        status === 'ringing' ||
        status === 'connecting' ||
        status === 'requesting-mic'
      ) {
        const apiUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        navigator.sendBeacon?.(
          `${apiUrl}/calls/${callId}/end`,
          new Blob([JSON.stringify({})], { type: 'application/json' })
        );
        removeCallFromStorage();
      }
      // Connected paytida — hech nima qilmaymiz, storage'da qoladi
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, removeCallFromStorage]);

  // ═══════════════════════════════════════════════════
  // Cleanup on unmount
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    isUnmountingRef.current = false;
    return () => {
      isUnmountingRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return { status, errorMessage, startCall, hangUp, isReconnecting };
}