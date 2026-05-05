// src/hooks/calls/useGuestIncomingPolling.ts

import { useEffect, useRef, useState } from 'react';
import { checkIncomingCall } from '@services/guestAuth';
import { getSocket } from '@services/socket';
import { guestTokenService } from '@services/guestToken';
import type { IncomingCallForGuest } from '@services/guestAuth';

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
const POLL_INTERVAL_DISCONNECTED_MS = 30_000;   // Socket xato bo'lganda — 30 sek
const POLL_INTERVAL_CONNECTED_MS = 120_000;     // Socket OK bo'lganda — 2 daqiqa (safety)
const STATE_CHECK_INTERVAL_MS = 1_000;          // Socket holatini har 1 sek sync

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export interface IncomingCallData {
  callId: string;
  roomNumber: string;
  offerSdp: string;
  initiatedByName: string;
}

/**
 * Mehmon — Manager qo'ng'iroq qilganmi tekshiradi
 *
 * SMART HYBRID:
 *   - Socket.IO asosiy yo'l (real-time, 50ms latency)
 *   - Polling backup (Socket xato bo'lganda yoqiladi)
 *   - Socket connected: polling 2 daqiqada bir (safety)
 *   - Socket disconnected: polling 30 sek (active)
 *
 * @param enabled - hook yoqilgan/o'chirilgan (showMain)
 * @param hotelSlug - mehmonning oteli
 * @param roomNumber - mehmonning hozirgi xona raqami
 */
export function useGuestIncomingPolling(
  enabled: boolean,
  hotelSlug?: string,
  roomNumber?: string
) {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [socketConnected, setSocketConnected] = useState(false);

  const lastSeenCallIdRef = useRef<string | null>(null);
  const hasJoinedRoomRef = useRef<boolean>(false);

  // ═══════════════════════════════════════════════════════
  // SOCKET.IO — asosiy real-time connection
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !hotelSlug || !roomNumber) {
      console.log('[useGuestSocket] Skipped:', {
        enabled,
        hotelSlug,
        roomNumber,
      });
      return;
    }

    const token = guestTokenService.get();
    if (!token) {
      console.warn('[useGuestSocket] No token, Socket disabled');
      return;
    }

    console.log('[useGuestSocket] 🚀 Initializing...');
    const socket = getSocket(token);
    hasJoinedRoomRef.current = false;

    // ─── Join room ───────────────────────────────────
    const joinRoom = () => {
      if (!socket.connected) return;
      if (hasJoinedRoomRef.current) return;

      socket.emit('guest:join', { hotelSlug, roomNumber });
      hasJoinedRoomRef.current = true;
      console.log(
        `[useGuestSocket] ✅ Joined room: guest:${hotelSlug}:${roomNumber}`
      );
      setSocketConnected(true);
    };

    // ─── Connect handler ─────────────────────────────
    const handleConnect = () => {
      console.log('[useGuestSocket] 🔌 Socket connected event!');
      hasJoinedRoomRef.current = false;
      joinRoom();
    };

    // ─── Disconnect handler ──────────────────────────
    const handleDisconnect = (reason: string) => {
      console.log('[useGuestSocket] 🔌 Disconnected:', reason);
      hasJoinedRoomRef.current = false;
      setSocketConnected(false);
    };

    // ─── Incoming call handler ───────────────────────
    const handleIncomingCall = (data: any) => {
      console.log('[useGuestSocket] 📞 Incoming call:', data);

      if (!data?.callId || !data?.offerSdp) return;
      if (data.callId === lastSeenCallIdRef.current) return;

      lastSeenCallIdRef.current = data.callId;
      setIncomingCall({
        callId: data.callId,
        roomNumber: data.roomNumber || roomNumber,
        offerSdp: data.offerSdp,
        initiatedByName: data.initiatedByName || 'Reception',
      });
    };

    // ─── Connect error handler ───────────────────────
    const handleConnectError = (err: Error) => {
      console.warn('[useGuestSocket] ⚠️ Connection error:', err.message);
      setSocketConnected(false);
    };

    // ⭐ Listenerlarni qo'shish (avval, keyin connected tekshirish)
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('incoming-call', handleIncomingCall);

    // ⭐ Allaqachon ulangan bo'lsa darhol join (race condition fix)
    if (socket.connected) {
      console.log(
        '[useGuestSocket] ⚡ Socket already connected — joining immediately'
      );
      joinRoom();
    } else {
      console.log(
        '[useGuestSocket] ⏳ Waiting for connect event...'
      );
    }

    // ⭐ State sync — har 1 sek tekshiruv (HMR safe)
    const stateCheckInterval = setInterval(() => {
      const isConnected = socket.connected;

      setSocketConnected(prev => {
        if (prev !== isConnected) {
          console.log(
            `[useGuestSocket] 🔄 State sync: ${prev} → ${isConnected}`
          );
        }
        return isConnected;
      });

      // Auto-recover: ulangan, lekin room'ga qo'shilmagan
      if (isConnected && !hasJoinedRoomRef.current) {
        console.log('[useGuestSocket] 🔁 Re-joining room');
        joinRoom();
      }
    }, STATE_CHECK_INTERVAL_MS);

    return () => {
      console.log('[useGuestSocket] 🧹 Cleanup');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('incoming-call', handleIncomingCall);
      clearInterval(stateCheckInterval);
    };
  }, [enabled, hotelSlug, roomNumber]);


  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    // ⭐ Smart interval — Socket holatiga qarab
    const intervalMs = socketConnected
      ? POLL_INTERVAL_CONNECTED_MS
      : POLL_INTERVAL_DISCONNECTED_MS;

    const intervalLabel = socketConnected
      ? '2 daqiqa (safety check)'
      : '30 sek (active fallback)';

    console.log(
      `[useGuestPolling] ${
        socketConnected ? '🟢' : '🟡'
      } Polling interval: ${intervalLabel}`
    );

    const poll = async () => {
      if (cancelled) return;

      try {
        const result: IncomingCallForGuest = await checkIncomingCall(
          roomNumber
        );

        if (cancelled) return;

        if (result.hasCall && result.callId && result.offerSdp) {
          if (result.callId !== lastSeenCallIdRef.current) {
            console.log(
              '[useGuestPolling-fallback] Found call via polling:',
              result.callId
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
        // silent — keyingi pollingda qayta urinadi
      }
    };

    // ⭐ Faqat Socket xato bo'lganda darhol so'raymiz
    // Socket OK bo'lsa, kutib turamiz (server yuklamasini kamaytirish uchun)
    if (!socketConnected) {
      poll();
    }

    const interval = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomNumber, socketConnected]);

  // ═══════════════════════════════════════════════════════
  // Dismiss call (modal close)
  // ═══════════════════════════════════════════════════════
  const dismissCall = () => {
    setIncomingCall(null);
  };

  return { incomingCall, dismissCall, socketConnected };
}