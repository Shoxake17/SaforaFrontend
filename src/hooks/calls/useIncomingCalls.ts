// src/hooks/calls/useIncomingCalls.ts
// ⭐ PRO VERSION — Manager Smart Hybrid (Socket + intelligent polling)
import { useEffect, useState, useRef, useCallback } from 'react';
import { pollCalls } from '@services/calls';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import type { IncomingCall } from '@services/calls';

const POLL_INTERVAL_DISCONNECTED_MS = 3_000;
const POLL_INTERVAL_CONNECTED_MS = 120_000;
const STATE_CHECK_INTERVAL_MS = 1_000;

interface UseIncomingCallsResult {
  incomingCall: IncomingCall | null;
  clearCall: () => void;
  dismissCall: (callId: string) => void;
}

function detectHotelSlugFromUrl(): string | null {
  try {
    const path = window.location.pathname;
    const match = path.match(/\/portal\/([^/]+)/);
    if (match && match[1]) return match[1];
    return null;
  } catch {
    return null;
  }
}

export function useIncomingCalls(
  hotelSlugProp?: string
): UseIncomingCallsResult {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const currentCallIdRef = useRef<string | null>(null);
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());
  const hasJoinedRoomRef = useRef<boolean>(false);

  const hotelSlug = hotelSlugProp || detectHotelSlugFromUrl();

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

      for (const c of data.calls) {
        if (c.reconnectAttemptedBy && dismissedCallIdsRef.current.has(c.id)) {
          console.log(
            '[useIncomingCalls] Removing from dismissed (reconnect):',
            c.id,
            '| by:',
            c.reconnectAttemptedBy
          );
          dismissedCallIdsRef.current.delete(c.id);
        }
      }

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
    const token = tokenService.get();
    if (!token) {
      console.warn('[useIncomingCalls] No staff token, Socket disabled');
      return;
    }

    if (!hotelSlug) {
      console.warn('[useIncomingCalls] No hotelSlug detected — Socket disabled');
      return;
    }

    console.log('[useIncomingCalls] 🚀 Initializing Socket for:', hotelSlug);
    const socket = getSocket(token);
    hasJoinedRoomRef.current = false;

    const joinRoom = () => {
      if (!socket.connected) return;
      if (hasJoinedRoomRef.current) return;

      socket.emit('staff:join', { hotelSlug });
      hasJoinedRoomRef.current = true;
      console.log(
        `[useIncomingCalls] ✅ Joined staff room: staff:${hotelSlug}`
      );
      setSocketConnected(true);
    };

    const handleConnect = () => {
      console.log('[useIncomingCalls] 🔌 Socket connected!');
      hasJoinedRoomRef.current = false;
      joinRoom();
    };

    const handleDisconnect = (reason: string) => {
      console.log('[useIncomingCalls] 🔌 Disconnected:', reason);
      hasJoinedRoomRef.current = false;
      setSocketConnected(false);
    };

    const handleNewCall = (data: any) => {
      console.log('[useIncomingCalls] 📞 New call from guest (Socket):', data);

      if (!data?.id) return;
      if (dismissedCallIdsRef.current.has(data.id)) return;

      const callData: IncomingCall = {
        id: data.id,
        roomNumber: data.roomNumber,
        guestName: data.guestName,
        guestPhone: data.guestPhone || '',
        createdAt: data.createdAt,
        reconnectAttemptedBy: data.reconnectAttemptedBy || null,
      };

      currentCallIdRef.current = data.id;
      setIncomingCall(callData);
    };

    const handleConnectError = (err: Error) => {
      console.warn('[useIncomingCalls] ⚠️ Connection error:', err.message);
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('new-call', handleNewCall);

    if (socket.connected) {
      console.log(
        '[useIncomingCalls] ⚡ Socket already connected — joining immediately'
      );
      joinRoom();
    } else {
      console.log('[useIncomingCalls] ⏳ Waiting for connect event...');
    }

    const stateCheckInterval = setInterval(() => {
      const isConnected = socket.connected;

      setSocketConnected(prev => {
        if (prev !== isConnected) {
          console.log(
            `[useIncomingCalls] 🔄 State sync: ${prev} → ${isConnected}`
          );
        }
        return isConnected;
      });

      if (isConnected && !hasJoinedRoomRef.current) {
        console.log('[useIncomingCalls] 🔁 Re-joining staff room');
        joinRoom();
      }
    }, STATE_CHECK_INTERVAL_MS);

    return () => {
      console.log('[useIncomingCalls] 🧹 Cleanup');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('new-call', handleNewCall);
      clearInterval(stateCheckInterval);
    };
  }, [hotelSlug]);

  useEffect(() => {
    const intervalMs = socketConnected
      ? POLL_INTERVAL_CONNECTED_MS
      : POLL_INTERVAL_DISCONNECTED_MS;

    const intervalLabel = socketConnected
      ? '2 daqiqa (safety check)'
      : '3 sek (active fallback)';

    console.log(
      `[useIncomingCalls] ${
        socketConnected ? '🟢' : '🟡'
      } Polling interval: ${intervalLabel}`
    );

    if (!socketConnected) {
      poll();
    }

    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [poll, socketConnected]);

  const clearCall = useCallback(() => {
    currentCallIdRef.current = null;
    setIncomingCall(null);
  }, []);

  const dismissCall = useCallback((callId: string) => {
    dismissedCallIdsRef.current.add(callId);
    currentCallIdRef.current = null;
    setIncomingCall(null);
  }, []);

  return { incomingCall, clearCall, dismissCall };
}

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