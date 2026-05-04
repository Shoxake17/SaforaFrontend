// src/hooks/calls/useGuestIncomingPolling.ts
import { useEffect, useRef, useState } from 'react';
import { checkIncomingCall } from '@services/guestAuth';
import type { IncomingCallForGuest } from '@services/guestAuth';

const POLL_INTERVAL_MS = 3000;

export interface IncomingCallData {
  callId: string;
  roomNumber: string;
  offerSdp: string;
  initiatedByName: string;
}

/**
 * Mehmon polling — Manager qo'ng'iroq qilganmi tekshiradi
 * @param enabled - polling yoqilgan/o'chirilgan
 * @param roomNumber - mehmonning hozirgi xona raqami (filter uchun)
 */
export function useGuestIncomingPolling(
  enabled: boolean,
  roomNumber?: string
) {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const lastSeenCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        // ⭐ roomNumber bilan polling
        const result: IncomingCallForGuest = await checkIncomingCall(roomNumber);

        if (cancelled) return;

        if (result.hasCall && result.callId && result.offerSdp) {
          if (result.callId !== lastSeenCallIdRef.current) {
            console.log(
              '[useGuestIncomingPolling] New incoming call:',
              result.callId,
              'for room:',
              roomNumber
            );
            lastSeenCallIdRef.current = result.callId;
            setIncomingCall({
              callId: result.callId,
              roomNumber: result.roomNumber || '',
              offerSdp: result.offerSdp,
              initiatedByName: result.initiatedByName || 'Reception',
            });
          }
        }
      } catch {
        // silent
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomNumber]);

  const dismissCall = () => {
    setIncomingCall(null);
  };

  return { incomingCall, dismissCall };
}