// src/hooks/useStaffNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';

export interface StaffNotification {
  id: string;
  type: 'broadcast' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  broadcastId?: string;
}

const STORAGE_KEY = 'safora_staff_notifs';
const MAX_NOTIFICATIONS = 50;

const loadFromStorage = (): StaffNotification[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveToStorage = (notifs: StaffNotification[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS))); }
  catch {}
};

const playFeedback = () => {
  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export const useStaffNotifications = () => {
  const [notifications, setNotifications] = useState<StaffNotification[]>(loadFromStorage);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const addNotification = useCallback((data: any) => {
    const dedupeKey = `broadcast_${data.broadcastId || data._id}`;
    if (seenIdsRef.current.has(dedupeKey)) return;
    seenIdsRef.current.add(dedupeKey);

    const newNotif: StaffNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: 'broadcast',
      title: data.title || 'Broadcast',
      message: data.message,
      broadcastId: data.broadcastId || data._id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    playFeedback();
  }, []);

  useEffect(() => {
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleBroadcast = (data: any) => {
      console.log('[StaffNotif] 📢 broadcast:staff RECEIVED:', data);
      addNotification(data);
    };

    socket.on('broadcast:staff', handleBroadcast);

    return () => {
      socket.off('broadcast:staff', handleBroadcast);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
    clearAll,
  };
};
