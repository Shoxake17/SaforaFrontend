// src/components/IncomingCall/useIncomingCalls.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { pollCalls } from '@services/calls';
import type { IncomingCall } from '@services/calls';

const POLL_INTERVAL_MS = 3000;

interface UseIncomingCallsResult {
  incomingCall: IncomingCall | null;
  clearCall: () => void;
  dismissCall: (callId: string) => void;
}

/**
 * Manager dashboard'da ishlaydi.
 * Har 3 sekundda backend'dan yangi calls'ni so'raydi.
 * Birinchi ringing call'ni qaytaradi.
 */
export function useIncomingCalls(): UseIncomingCallsResult {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const currentCallIdRef = useRef<string | null>(null);

  // End/Decline qilingan call'lar — qayta ochilmasligi uchun
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const data = await pollCalls();

      if (!data.success || !data.calls || data.calls.length === 0) {
        if (currentCallIdRef.current) {
          currentCallIdRef.current = null;
          setIncomingCall(null);
        }
        return;
      }

      // ✅ MUHIM: reconnectAttemptedBy bo'lsa, dismissed Set'dan chiqarish
      // (Mehmon refresh qilgan bo'lsa, qayta ko'rinishi kerak — AUTO-ACCEPT uchun)
      for (const c of data.calls) {
        if (c.reconnectAttemptedBy && dismissedCallIdsRef.current.has(c.id)) {
          console.log(
            '[useIncomingCalls] Removing call from dismissed (reconnect detected):',
            c.id,
            '| by:',
            c.reconnectAttemptedBy
          );
          dismissedCallIdsRef.current.delete(c.id);
        }
      }

      // Dismissed bo'lmagan birinchi call'ni topish
      const latest = data.calls.find(
        c => !dismissedCallIdsRef.current.has(c.id)
      );

      if (!latest) {
        if (currentCallIdRef.current) {
          currentCallIdRef.current = null;
          setIncomingCall(null);
        }
        return;
      }

      // ✅ MUHIM: Yangi call yoki RECONNECT bo'lsa state'ni yangilash
      // (reconnectAttemptedBy bo'lsa, parent komponent yangi data olishi uchun)
      const isReconnect = !!latest.reconnectAttemptedBy;
      const isNewCall = currentCallIdRef.current !== latest.id;

      if (isNewCall || isReconnect) {
        currentCallIdRef.current = latest.id;
        setIncomingCall(latest);
      }
    } catch (err) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  const clearCall = useCallback(() => {
    currentCallIdRef.current = null;
    setIncomingCall(null);
  }, []);

  // Call'ni dismissed setiga qo'shish
  const dismissCall = useCallback((callId: string) => {
    dismissedCallIdsRef.current.add(callId);
    currentCallIdRef.current = null;
    setIncomingCall(null);
  }, []);

  return { incomingCall, clearCall, dismissCall };
}

// ═══════════════════════════════════════════════════════
// RINGTONE HOOK (telefon ovozi)
// ═══════════════════════════════════════════════════════
export function useRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      stopRingtone();
      return;
    }
    startRingtone();
    return () => stopRingtone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const playRing = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    [440, 554].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  };

  const startRingtone = () => {
    try {
      ctxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      playRing();
      intervalRef.current = window.setInterval(playRing, 1800);
    } catch (err) {
      console.warn('[useRingtone] AudioContext error:', err);
    }
  };

  const stopRingtone = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch (err) {
        // ignore
      }
      ctxRef.current = null;
    }
  };
}