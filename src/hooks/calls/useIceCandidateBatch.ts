// src/hooks/calls/useIceCandidateBatch.ts
import { useCallback, useRef, useEffect } from 'react';
import { sendIceCandidates } from '@services/calls';
import type { ICECandidate } from '@services/calls';
import { ICE_FLUSH_DELAY_MS } from '@config/callConfig';

interface UseIceCandidateBatchParams {
  getCallId: () => string | null;
  from: 'guest' | 'staff';
}

interface UseIceCandidateBatchResult {
  enqueue: (candidate: ICECandidate) => void;
  reset: () => void;
}

export function useIceCandidateBatch({
  getCallId,
  from,
}: UseIceCandidateBatchParams): UseIceCandidateBatchResult {
  const pendingRef = useRef<ICECandidate[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  const flush = useCallback(async () => {
    const callId = getCallId();
    if (!callId || pendingRef.current.length === 0) return;

    const batch = [...pendingRef.current];
    pendingRef.current = [];

    try {
      await sendIceCandidates(callId, batch, from);
    } catch (err) {
      pendingRef.current.unshift(...batch);
    }
  }, [getCallId, from]);

  const enqueue = useCallback(
    (candidate: ICECandidate) => {
      pendingRef.current.push(candidate);

      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = window.setTimeout(flush, ICE_FLUSH_DELAY_MS);
    },
    [flush]
  );

  const reset = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return { enqueue, reset };
}