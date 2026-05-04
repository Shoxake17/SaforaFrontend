// src/hooks/calls/useStaffOutgoingCall.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initiateCallFromStaff,
  getCallStatus,
  endCall,
} from '@services/calls';
import { useWebRTCPeer } from '@hooks/calls/useWebRTCPeer';
import { useIceCandidateBatch } from '@hooks/calls/useIceCandidateBatch';
import {
  STAFF_STATUS_POLL_MS,
  ENDED_CLEANUP_DELAY_MS,
  HANGUP_CLEANUP_DELAY_MS,
} from '@config/callConfig';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export type StaffOutgoingStatus =
  | 'idle'
  | 'requesting-mic'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'ended'
  | 'failed';

interface UseStaffOutgoingCallParams {
  onEnded?: () => void;
}

interface UseStaffOutgoingCallResult {
  status: StaffOutgoingStatus;
  errorMessage: string;
  guestInfo: { name: string; phone: string } | null;
  startCall: (roomNumber: string) => Promise<void>;
  hangUp: () => void;
}

// ═══════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════
export function useStaffOutgoingCall({
  onEnded,
}: UseStaffOutgoingCallParams = {}): UseStaffOutgoingCallResult {
  const [status, setStatus] = useState<StaffOutgoingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [guestInfo, setGuestInfo] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  // Refs (WebRTC resources)
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const addedGuestIceCountRef = useRef<number>(0);
  const startingRef = useRef<boolean>(false);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // DRY hooks
  const { createPeer, silentlyClosePeer } = useWebRTCPeer();
  const { enqueue: enqueueIce, reset: resetIceQueue } = useIceCandidateBatch({
    getCallId: () => callIdRef.current,
    from: 'staff',
  });

  // ═══════════════════════════════════════════════════
  // CLEANUP
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
    startingRef.current = false;
  }, [silentlyClosePeer, resetIceQueue]);

  // ═══════════════════════════════════════════════════
  // CALL ENDED
  // ═══════════════════════════════════════════════════
  const handleCallEnded = useCallback(() => {
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, ENDED_CLEANUP_DELAY_MS);
  }, [cleanup]);

  // ═══════════════════════════════════════════════════
  // POLL — answerSdp + guest ICE + status
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

      // Mehmon answer berdi → setRemoteDescription
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
          console.error('[useStaffOutgoingCall] setRemoteDescription error:', err);
        }
      }

      // Guest ICE candidates
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
            // ignore
          }
        }
        addedGuestIceCountRef.current = data.iceGuest.length;
      }
    } catch {
      // silent
    }
  }, [handleCallEnded]);

  // ═══════════════════════════════════════════════════
  // START CALL
  // ═══════════════════════════════════════════════════
  const startCall = useCallback(
    async (roomNumber: string) => {
      if (startingRef.current) {
        console.warn('[useStaffOutgoingCall] startCall already in progress');
        return;
      }
      startingRef.current = true;

      try {
        cleanup();
        callIdRef.current = null;
        setErrorMessage('');
        setGuestInfo(null);

        setStatus('requesting-mic');

        // Peer + offer
        const { peer, stream, audio } = await createPeer({
          onIceCandidate: enqueueIce,
          onConnectionStateChange: state => {
            if (state === 'connected') {
              setStatus('connected');
            } else if (state === 'failed' || state === 'closed') {
              handleCallEnded();
            }
          },
          onDisconnectTimeout: handleCallEnded,
        });

        peerRef.current = peer;
        localStreamRef.current = stream;
        remoteAudioRef.current = audio;

        setStatus('connecting');

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        // Backend'ga yuborish
        const result = await initiateCallFromStaff({
          roomNumber,
          offerSdp: JSON.stringify(peer.localDescription),
        });

        if (!result.success || !result.callId) {
          // Online emas yoki boshqa xato
          if (result.code === 'GUEST_OFFLINE') {
            throw new Error('No guest is currently online in this room');
          }
          throw new Error(result.error || 'Failed to initiate call');
        }

        callIdRef.current = result.callId;
        if (result.guest) {
          setGuestInfo(result.guest);
        }

        setStatus('ringing');

        // Polling boshlash
        pollTimerRef.current = window.setInterval(
          pollStatus,
          STAFF_STATUS_POLL_MS
        );
      } catch (err: unknown) {
        console.error('[useStaffOutgoingCall] startCall error:', err);

        let msg = 'Could not start call';
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
      } finally {
        startingRef.current = false;
      }
    },
    [cleanup, createPeer, enqueueIce, handleCallEnded, pollStatus]
  );

  // ═══════════════════════════════════════════════════
  // HANG UP
  // ═══════════════════════════════════════════════════
  const hangUp = useCallback(() => {
    const callId = callIdRef.current;
    if (callId) {
      endCall(callId).catch(() => {});
    }
    setStatus('ended');
    setTimeout(() => {
      cleanup();
      callIdRef.current = null;
      onEndedRef.current?.();
    }, HANGUP_CLEANUP_DELAY_MS);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { status, errorMessage, guestInfo, startCall, hangUp };
}