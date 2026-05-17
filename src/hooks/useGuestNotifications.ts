// src/hooks/useGuestNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@services/socket';
import { guestTokenService } from '@services/guestToken';   // ⭐ YANGI

export interface GuestNotification {
  id: string;
  type: 'approved' | 'cancelled' | 'broadcast';
  serviceType: string;
  serviceLabel: string;
  message: string;
  responseMessage?: string;
  timestamp: string;
  read: boolean;
  requestId?: string;
  broadcastId?: string;
}

const STORAGE_PREFIX = 'guest_notifs';
const MAX_NOTIFICATIONS = 50;

const SERVICE_LABELS: Record<string, string> = {
  restaurant:  'Restaurant',
  yandex_taxi: 'Taxi',
  spa:         'Spa',
  pool:        'Pool',
  gym:         'Gym',
  laundry:     'Laundry',
  wake_up:     'Wake-up',
  concierge:   'Concierge',
};

const getStorageKey = (hotelSlug: string, roomNumber: string) =>
  `${STORAGE_PREFIX}_${hotelSlug}_${roomNumber}`;

const loadFromStorage = (key: string): GuestNotification[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
};

const saveToStorage = (key: string, notifs: GuestNotification[]) => {
  try { localStorage.setItem(key, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS))); }
  catch {}
};

// ⭐⭐⭐ Token'ni topish — guestTokenService asosiy source
const resolveToken = (propToken?: string): string => {
  if (propToken) return propToken;

  const fromService = guestTokenService.get();
  if (fromService) return fromService;

  // 2) Fallback'lar (boshqa nomlar bilan saqlangan bo'lsa)
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('safora_guest_token') ||
    localStorage.getItem('guest_token') ||
    localStorage.getItem('guestToken') ||
    localStorage.getItem('token') ||
    ''
  );
};

// ⭐ URL'dan slug/room fallback
const parseUrlPath = (): { slug: string; room: string } => {
  if (typeof window === 'undefined') return { slug: '', room: '' };
  const parts = window.location.pathname.split('/').filter(Boolean);
  const startIdx = parts[0] === 'guest' ? 1 : 0;
  return {
    slug: parts[startIdx] || '',
    room: parts[startIdx + 1] || '',
  };
};

const playFeedback = (enableSound: boolean) => {
  if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]);
  if (enableSound) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
};

interface UseGuestNotificationsOptions {
  hotelSlug: string;
  roomNumber: string;
  token?: string;
  enableSound?: boolean;
  onNewNotification?: (n: GuestNotification) => void;
}

export const useGuestNotifications = ({
  hotelSlug: propSlug,
  roomNumber: propRoom,
  token,
  enableSound = true,
  onNewNotification,
}: UseGuestNotificationsOptions) => {
  // ⭐ Props bo'sh bo'lsa — URL'dan olamiz
  const urlParsed = parseUrlPath();
  const hotelSlug = propSlug || urlParsed.slug;
  const roomNumber = propRoom ? String(propRoom) : urlParsed.room;

  const storageKey = hotelSlug && roomNumber ? getStorageKey(hotelSlug, roomNumber) : '';

  const [notifications, setNotifications] = useState<GuestNotification[]>(() =>
    storageKey ? loadFromStorage(storageKey) : []
  );

  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (storageKey) saveToStorage(storageKey, notifications);
  }, [storageKey, notifications]);

  const addNotification = useCallback((data: any) => {
    const newStatus = data?.status;
    if (newStatus !== 'approved' && newStatus !== 'cancelled') return;

    const dedupeKey = `${data._id || data.request_id}_${newStatus}`;
    if (seenIdsRef.current.has(dedupeKey)) return;
    seenIdsRef.current.add(dedupeKey);

    const serviceType = data.service_type || 'unknown';
    const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;
    const isOrder = serviceType === 'restaurant';

    const message =
      newStatus === 'approved'
        ? isOrder
          ? 'Your order has been accepted ✓'
          : `Your ${serviceLabel} request has been approved ✓`
        : isOrder
          ? 'Your order was cancelled'
          : `Your ${serviceLabel} request was cancelled`;

    const newNotif: GuestNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: newStatus,
      serviceType,
      serviceLabel,
      message,
      responseMessage: data.response_message,
      requestId: data._id || data.request_id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    console.log('[GuestNotif] ✨ Adding:', newNotif);
    setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    playFeedback(enableSound);
    onNewNotification?.(newNotif);
  }, [enableSound, onNewNotification]);

  const addBroadcastNotification = useCallback((data: any) => {
    const dedupeKey = `broadcast_${data.broadcastId || data._id}`;
    if (seenIdsRef.current.has(dedupeKey)) return;
    seenIdsRef.current.add(dedupeKey);

    const newNotif: GuestNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: 'broadcast',
      serviceType: 'broadcast',
      serviceLabel: 'Safora',
      message: data.title,
      responseMessage: data.message,
      broadcastId: data.broadcastId || data._id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    console.log('[GuestNotif] 📢 Broadcast received:', newNotif);
    setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    playFeedback(enableSound);
    onNewNotification?.(newNotif);
  }, [enableSound, onNewNotification]);

  // ⭐⭐⭐ Singleton socket + listener qo'shish
  useEffect(() => {
    // ⭐ HAR DOIM log — qaytmasdan oldin
    console.log('[GuestNotif] 🔍 useEffect RAN', {
      propSlug,
      propRoom,
      urlSlug: urlParsed.slug,
      urlRoom: urlParsed.room,
      finalSlug: hotelSlug,
      finalRoom: roomNumber,
    });

    if (!hotelSlug || !roomNumber) {
      console.error('[GuestNotif] ⛔ EARLY RETURN — slug yoki room bo\'sh!', {
        hotelSlug,
        roomNumber,
      });
      return;
    }

    const resolvedToken = resolveToken(token);

    console.log('[GuestNotif] 🔑 Token:',
      resolvedToken ? `${resolvedToken.substring(0, 30)}... (len=${resolvedToken.length})` : '⚠️ NONE'
    );

    if (!resolvedToken) {
      console.error('[GuestNotif] 🔴 NO TOKEN');
      console.log('[GuestNotif] 💡 localStorage keys:');
      Object.keys(localStorage).forEach((k) => {
        const val = localStorage.getItem(k) || '';
        console.log(`  - ${k} : ${val.substring(0, 40)}${val.length > 40 ? '...' : ''}`);
      });
      return;
    }

    // ⭐ SINGLETON socket
    console.log('[GuestNotif] 🔌 Calling getSocket()...');
    const socket = getSocket(resolvedToken);

    // ⭐⭐⭐ DEBUG uchun window'ga bog'lab qo'yamiz
    (window as any).__notifSocket = socket;
    (window as any).__guestSocket = socket;

    console.log('[GuestNotif] ✅ Socket obtained:', {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id,
    });

    const joinRoom = () => {
      console.log('[GuestNotif] 🚪 emit guest:join', { hotelSlug, roomNumber });
      socket.emit('guest:join', { hotelSlug, roomNumber });
    };

    if (socket.connected) joinRoom();

    const handleConnect = () => {
      console.log('[GuestNotif] ✅ socket connected:', socket.id);
      joinRoom();
    };

    const handleDisconnect = (reason: string) => {
      console.warn('[GuestNotif] ❌ disconnected:', reason);
    };

    const handleConnectError = (err: Error) => {
      console.error('[GuestNotif] 🔴 connect_error:', err.message);
    };

    const handleStatusChanged = (data: any) => {
      console.log('[GuestNotif] 🎯 request:status_changed RECEIVED:', data);
      if (data?.room_number && String(data.room_number) !== String(roomNumber)) {
        console.log('[GuestNotif] ⏭️ different room — skip');
        return;
      }
      addNotification(data);
    };

    const handleBroadcast = (data: any) => {
      console.log('[GuestNotif] 📢 broadcast:guest RECEIVED:', data);
      addBroadcastNotification(data);
    };

    const handleLegacyApproved = (data: any) => {
      console.log('[GuestNotif] 🎯 request:approved (legacy):', data);
      addNotification({
        _id: data.request_id,
        request_id: data.request_id,
        service_type: data.service_type,
        status: 'approved',
        response_message: data.message,
      });
    };

    const handleLegacyCancelled = (data: any) => {
      console.log('[GuestNotif] 🎯 request:cancelled (legacy):', data);
      addNotification({
        _id: data.request_id,
        request_id: data.request_id,
        service_type: data.service_type,
        status: 'cancelled',
        response_message: data.message,
      });
    };

    const handleAny = (event: string, ...args: any[]) => {
      if (event !== 'ping' && event !== 'pong') {
        console.log('[GuestNotif] 📡 [ANY EVENT]:', event, args);
      }
    };

    socket.onAny(handleAny);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('request:status_changed', handleStatusChanged);
    socket.on('request:approved', handleLegacyApproved);
    socket.on('request:cancelled', handleLegacyCancelled);
    socket.on('broadcast:guest', handleBroadcast);

    return () => {
      console.log('[GuestNotif] 🧹 useEffect CLEANUP');
      socket.offAny(handleAny);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('request:status_changed', handleStatusChanged);
      socket.off('request:approved', handleLegacyApproved);
      socket.off('request:cancelled', handleLegacyCancelled);
      socket.off('broadcast:guest', handleBroadcast);
      // ⚠️ socket.disconnect() CHAQIRMAYMIZ — singleton boshqa joyda kerak
    };
  }, [hotelSlug, roomNumber, token, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    seenIdsRef.current.clear();
  }, []);

  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};