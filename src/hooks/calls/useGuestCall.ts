// src/pages/guest/hooks/useGuestCall.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initiateCall,
  getCallStatus,
  endCall,
  reconnectCall,
} from '@services/calls';
import { useWebRTCPeer } from '@hooks/calls/useWebRTCPeer';
import { useIceCandidateBatch } from '@hooks/calls/useIceCandidateBatch';
import { useCallStorage } from '@hooks/calls/useCallStorage';
import type { StoredGuestCall } from '@hooks/calls/useCallStorage';
import {
  GUEST_POLL_INTERVAL_MS,
  STORAGE_KEYS,
  ENDED_CLEANUP_DELAY_MS,
  HANGUP_CLEANUP_DELAY_MS,
} from '@config/callConfig';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
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
  /** Call ended/missed bo'lganda chaqiriladi (modal yopish uchun) */
  onEnded?: () => void;
}

interface UseGuestCallResult {
  status: GuestCallStatus;
  errorMessage: string;
  startCall: () => Promise<void>;
  hangUp: () => void;
  isReconnecting: boolean;
}

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════
export function useGuestCall({
  hotelSlug,
  roomNumber,
  guestName,
  guestPhone,
  onEnded,
}: UseGuestCallParams): UseGuestCallResult {
  const [status, setStatus] = useState<GuestCallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  // ═════ Refs (WebRTC resources) ═════
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const addedStaffIceCountRef = useRef<number>(0);

  // Manager reconnect detect
  const previousStatusRef = useRef<string | null>(null);
  const handlingManagerReconnectRef = useRef<boolean>(false);

  // onEnded callback ref (to avoid re-creating callbacks)
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // ═════ DRY hooks ═════
  const { createPeer, silentlyClosePeer } = useWebRTCPeer();

  const { enqueue: enqueueIce, reset: resetIceQueue } = useIceCandidateBatch({
    getCallId: () => callIdRef.current,
    from: 'guest',
  });

  const storage = useCallStorage<StoredGuestCall>(STORAGE_KEYS.GUEST_CALL);

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
    addedStaffIceCountRef.current = 0;
    previousStatusRef.current = null;
    handlingManagerReconnectRef.current = false;
  }, [silentlyClosePeer, resetIceQueue]);

  // ═══════════════════════════════════════════════════
  // CALL ENDED handler
  // ═══════════════════════════════════════════════════
  const handleCallEnded = useCallback(() => {
    setStatus('ended');
    storage.remove();
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, ENDED_CLEANUP_DELAY_MS);
  }, [cleanup, storage]);

  // ═══════════════════════════════════════════════════
  // CREATE PEER + OFFER (DRY)
  // ═══════════════════════════════════════════════════
  const createPeerAndOffer = useCallback(async (): Promise<string> => {
    const { peer, stream, audio } = await createPeer({
      onIceCandidate: enqueueIce,
      onConnectionStateChange: state => {
        if (state === 'connected') {
          setStatus('connected');
          setIsReconnecting(false);
        } else if (state === 'failed' || state === 'closed') {
          if (!handlingManagerReconnectRef.current) {
            handleCallEnded();
          }
        }
      },
      onDisconnectTimeout: handleCallEnded,
    });

    peerRef.current = peer;
    localStreamRef.current = stream;
    remoteAudioRef.current = audio;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    return JSON.stringify(peer.localDescription);
  }, [createPeer, enqueueIce, handleCallEnded]);

  // ═══════════════════════════════════════════════════
  // POLL — status, manager reconnect, ICE
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

      // ═════ Manager reconnect detect ═════
      // 'answered' → 'ringing' = manager refresh qildi
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = data.status;

      if (
        previousStatus === 'answered' &&
        data.status === 'ringing' &&
        peer.remoteDescription &&
        !handlingManagerReconnectRef.current
      ) {
        console.log('[useGuestCall] Manager reconnect detected — recreating peer');
        handlingManagerReconnectRef.current = true;

        // Polling timer'ni bekor qilish
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        // Eski peer'ni JIM yopish
        silentlyClosePeer(
          peerRef.current,
          localStreamRef.current,
          remoteAudioRef.current
        );
        peerRef.current = null;
        localStreamRef.current = null;
        remoteAudioRef.current = null;
        resetIceQueue();
        addedStaffIceCountRef.current = 0;

        setStatus('reconnecting');
        setIsReconnecting(true);

        try {
          // Yangi peer + offer
          const offer = await createPeerAndOffer();
          await reconnectCall(callId, offer);

          setStatus('ringing');
          previousStatusRef.current = 'ringing';

          // Polling qayta boshlash
          pollTimerRef.current = window.setInterval(pollStatus, GUEST_POLL_INTERVAL_MS);

          console.log('[useGuestCall] Guest-side reconnect successful');
        } catch (err) {
          console.error('[useGuestCall] Guest-side reconnect failed:', err);
          handleCallEnded();
        } finally {
          handlingManagerReconnectRef.current = false;
        }
        return;
      }

      // ═════ Manager Accept — answerSdp keldi ═════
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

      // ═════ Manager ICE candidates ═════
      if (
        data.iceStaff &&
        data.iceStaff.length > addedStaffIceCountRef.current &&
        peer.remoteDescription
      ) {
        const newCandidates = data.iceStaff.slice(addedStaffIceCountRef.current);
        for (const c of newCandidates) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            // ignore
          }
        }
        addedStaffIceCountRef.current = data.iceStaff.length;
      }
    } catch {
      // Silent fail
    }
  }, [
    handleCallEnded,
    silentlyClosePeer,
    resetIceQueue,
    createPeerAndOffer,
  ]);

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
        // Call hali tirikmi tekshirish
        const callData = await getCallStatus(storedCallId);

        if (callData.status === 'ended' || callData.status === 'missed') {
          console.warn('[useGuestCall] Call already ended — cannot reconnect');
          storage.remove();
          setIsReconnecting(false);
          return false;
        }

        callIdRef.current = storedCallId;

        // Yangi peer + offer
        const offer = await createPeerAndOffer();
        await reconnectCall(storedCallId, offer);

        // Polling boshlash
        setStatus('ringing');
        previousStatusRef.current = 'ringing';
        pollTimerRef.current = window.setInterval(pollStatus, GUEST_POLL_INTERVAL_MS);

        // Storage yangilash (yangi startedAt)
        storage.save({
          callId: storedCallId,
          hotelSlug,
          roomNumber,
          guestName,
        });

        console.log('[useGuestCall] Reconnect successful, waiting for manager');
        return true;
      } catch (err) {
        console.error('[useGuestCall] Reconnect failed:', err);
        storage.remove();
        setIsReconnecting(false);
        cleanup();
        return false;
      }
    },
    [
      createPeerAndOffer,
      pollStatus,
      cleanup,
      storage,
      hotelSlug,
      roomNumber,
      guestName,
    ]
  );

  // ═══════════════════════════════════════════════════
  // START CALL
  // ═══════════════════════════════════════════════════
  const startCall = useCallback(async () => {
    // Avval localStorage'da active call bormi tekshirish
    const storedCall = storage.get();
    if (
      storedCall &&
      storedCall.hotelSlug === hotelSlug &&
      storedCall.roomNumber === roomNumber &&
      storedCall.guestName === guestName
    ) {
      console.log('[useGuestCall] Found stored call, attempting reconnect');
      const reconnected = await tryReconnect(storedCall.callId);
      if (reconnected) return;
    }

    // Yangi call boshlash
    cleanup();
    callIdRef.current = null;

    setErrorMessage('');
    setStatus('requesting-mic');

    try {
      setStatus('connecting');
      const offer = await createPeerAndOffer();

      const result = await initiateCall({
        hotelSlug,
        roomNumber,
        guestName,
        guestPhone,
        offerSdp: offer,
      });

      callIdRef.current = result.callId;

      // Storage'ga saqlash
      storage.save({
        callId: result.callId,
        hotelSlug,
        roomNumber,
        guestName,
      });

      setStatus('ringing');
      previousStatusRef.current = 'ringing';
      pollTimerRef.current = window.setInterval(pollStatus, GUEST_POLL_INTERVAL_MS);
    } catch (err: unknown) {
      console.error('[useGuestCall] startCall error:', err);

      let msg = 'Could not start call';
      if (err instanceof Error) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          msg =
            'Microphone access denied. Please allow microphone in browser settings.';
        } else if (err.message) {
          msg = err.message;
        }
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
    createPeerAndOffer,
    storage,
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
    storage.remove();
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, HANGUP_CLEANUP_DELAY_MS);
  }, [cleanup, storage]);

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
        storage.remove();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, storage]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { status, errorMessage, startCall, hangUp, isReconnecting };
}