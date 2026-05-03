// src/components/IncomingCall/useStaffCall.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getCallStatus,
  answerCall,
  endCall,
  staffReconnectCall,
} from '@services/calls';
import { useWebRTCPeer } from '@hooks/calls/useWebRTCPeer';
import { useIceCandidateBatch } from '@hooks/calls/useIceCandidateBatch';
import { useCallStorage } from '@hooks/calls/useCallStorage';
import type { StoredStaffCall } from '@hooks/calls/useCallStorage';
import {
  STAFF_STATUS_POLL_MS,
  STORAGE_KEYS,
  ENDED_CLEANUP_DELAY_MS,
  HANGUP_CLEANUP_DELAY_MS,
  FAILED_CLEANUP_DELAY_MS,
} from '@config/callConfig';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export type StaffCallStatus =
  | 'idle'
  | 'accepting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

interface UseStaffCallParams {
  /** Call tugagandan keyin chaqiriladi (overlay yopish uchun) */
  onEnded?: () => void;
}

interface UseStaffCallResult {
  status: StaffCallStatus;
  errorMessage: string;
  acceptCall: (callId: string) => Promise<void>;
  hangUp: () => void;
  pendingReconnectCallId: string | null;
}

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════
export function useStaffCall(
  params: UseStaffCallParams = {}
): UseStaffCallResult {
  const { onEnded } = params;

  // ═════ State ═════
  const [status, setStatus] = useState<StaffCallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pendingReconnectCallId, setPendingReconnectCallId] = useState<
    string | null
  >(null);
    
  // ═════ Refs (WebRTC resources) ═════
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const addedGuestIceCountRef = useRef<number>(0);
  const acceptingRef = useRef<boolean>(false);

  // onEnded callback ref (re-render'lardan saqlash)
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // ═════ DRY hooks ═════
  const { createPeer, silentlyClosePeer } = useWebRTCPeer();

  const { enqueue: enqueueIce, reset: resetIceQueue } = useIceCandidateBatch({
    getCallId: () => callIdRef.current,
    from: 'staff',
  });

  const storage = useCallStorage<StoredStaffCall>(STORAGE_KEYS.STAFF_CALL);

  // ═══════════════════════════════════════════════════
  // CLEANUP — barcha resourcelarni tozalash
  // ═══════════════════════════════════════════════════
  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    silentlyClosePeer(
      peerRef.current,
      localStreamRef.current,
      remoteAudioRef.current
    );
    peerRef.current = null;
    localStreamRef.current = null;
    remoteAudioRef.current = null;
    resetIceQueue();
    addedGuestIceCountRef.current = 0;
    acceptingRef.current = false;
  }, [silentlyClosePeer, resetIceQueue]);

  // ═══════════════════════════════════════════════════
  // CALL ENDED handler
  // ═══════════════════════════════════════════════════
  const handleCallEnded = useCallback(() => {
    setStatus('ended');
    storage.remove();
    setPendingReconnectCallId(null);
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, ENDED_CLEANUP_DELAY_MS);
  }, [cleanup, storage]);

  // ═══════════════════════════════════════════════════
  // POLL — guest ICE candidates va status
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
        const newCandidates = data.iceGuest.slice(
          addedGuestIceCountRef.current
        );
        for (const c of newCandidates) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            // ignore — candidate xato bo'lishi normal
          }
        }
        addedGuestIceCountRef.current = data.iceGuest.length;
      }
    } catch {
      // Silent fail — keyingi poll'da qayta urinadi
    }
  }, [handleCallEnded]);

  // ═══════════════════════════════════════════════════
  // ACCEPT CALL
  // ═══════════════════════════════════════════════════
  const acceptCall = useCallback(
    async (callId: string) => {
      // GUARD 1: duplicate accept (parallel chaqiruvlar)
      if (acceptingRef.current) {
        console.warn('[useStaffCall] acceptCall already in progress');
        return;
      }

      // GUARD 2: bir xil callId — mehmon reconnect signal
      // Eski peer'ni JIM yopib, yangi peer yaratamiz (callIdRef saqlanadi)
      if (callIdRef.current === callId && peerRef.current) {
        console.warn(
          '[useStaffCall] callId already accepted — re-accepting (guest reconnect)'
        );
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        silentlyClosePeer(
          peerRef.current,
          localStreamRef.current,
          remoteAudioRef.current
        );
        peerRef.current = null;
        localStreamRef.current = null;
        remoteAudioRef.current = null;
        resetIceQueue();
        addedGuestIceCountRef.current = 0;
        // callIdRef.current saqlanadi (bir xil sessiya davomi)
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

        // Yangi peer yaratish (DRY hook orqali)
        const created = await createPeer({
          onIceCandidate: enqueueIce,
          onConnectionStateChange: state => {
            if (state === 'connected') {
              setStatus('connected');
              storage.save({ callId });
            } else if (state === 'failed' || state === 'closed') {
              handleCallEnded();
            }
          },
          onDisconnectTimeout: handleCallEnded,
        });
        localPeer = created.peer;
        localStream = created.stream;
        localAudio = created.audio;

        // Mehmon offer'ini o'rnatish
        await localPeer.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(callData.offerSdp))
        );

        // Pre-buffered guest ICE candidates
        if (callData.iceGuest && callData.iceGuest.length > 0) {
          for (const c of callData.iceGuest) {
            try {
              await localPeer.addIceCandidate(new RTCIceCandidate(c));
            } catch {
              // ignore
            }
          }
          addedGuestIceCountRef.current = callData.iceGuest.length;
        }

        // Answer yaratish va backend'ga yuborish
        const answer = await localPeer.createAnswer();
        await localPeer.setLocalDescription(answer);

        const result = await answerCall(
          callId,
          JSON.stringify(localPeer.localDescription)
        );

        if (!result.success) {
          if (result.alreadyAnswered) {
            console.warn(
              '[useStaffCall] alreadyAnswered — silently cleaning duplicate'
            );
            silentlyClosePeer(localPeer, localStream, localAudio);
            acceptingRef.current = false;
            return;
          }
          throw new Error('Failed to answer call');
        }

        // Muvaffaqiyatli — refs'ga saqlash
        peerRef.current = localPeer;
        localStreamRef.current = localStream;
        remoteAudioRef.current = localAudio;

        setStatus('connected');
        storage.save({ callId });
        setPendingReconnectCallId(null);

        // Polling boshlash (har 2 sek — guest ICE va status)
        pollTimerRef.current = window.setInterval(
          pollStatus,
          STAFF_STATUS_POLL_MS
        );
        acceptingRef.current = false;
      } catch (err: unknown) {
        console.error('[useStaffCall] acceptCall error:', err);

        // Lokal resourcelarni jim yopish
        silentlyClosePeer(localPeer, localStream, localAudio);

        let msg = 'Could not accept call';
        if (err instanceof Error) {
          if (
            err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError'
          ) {
            msg = 'Microphone access denied.';
          } else if (err.message) {
            msg = err.message;
          }
        }

        setErrorMessage(msg);
        setStatus('failed');
        cleanup();

        setTimeout(() => {
          onEndedRef.current?.();
        }, FAILED_CLEANUP_DELAY_MS);
      }
    },
    [
      cleanup,
      pollStatus,
      createPeer,
      enqueueIce,
      silentlyClosePeer,
      resetIceQueue,
      handleCallEnded,
      storage,
    ]
  );

  // ═══════════════════════════════════════════════════
  // MOUNT — Refresh'dan keyin reconnect
  //
  // Workflow:
  // 1. localStorage'da call bormi tekshirish
  // 2. Backend'da call hali tirikmi (status !== 'ended')
  // 3. /staff-reconnect yuborish (offerSdp=''; status='ringing')
  // 4. pendingReconnectCallId set qilinadi
  // 5. Mehmon polling status='answered' → 'ringing' detect qiladi
  // 6. Mehmon yangi offer yuboradi
  // 7. Manager polling call'ni ko'radi → AUTO-ACCEPT
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    const stored = storage.get();
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
          storage.remove();
          setStatus('idle');
          return;
        }

        await staffReconnectCall(stored.callId);
        if (cancelled) return;

        setPendingReconnectCallId(stored.callId);
        console.log('[useStaffCall] Staff reconnect signal sent');
      } catch (err) {
        console.error('[useStaffCall] Staff reconnect failed:', err);
        storage.remove();
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
    storage.remove();
    setPendingReconnectCallId(null);
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, HANGUP_CLEANUP_DELAY_MS);
  }, [cleanup, storage]);

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