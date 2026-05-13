// src/components/QrOperations/QrOperations.tsx
// ⭐ SOCKET-ONLY VERSION — No polling, real-time updates for ALL stats
import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  ConciergeBell,
  MessageCircle,
  Phone,
} from 'lucide-react';
import StatCard from '@components/StatCard';
import { listRequests } from '@services/requests';
import { getCallHistory } from '@services/calls';
import { getSocket } from '@services/socket';
import { tokenService } from '@services/auth';
import './QrOperations.css';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface QrOperationsProps {
  hotelSlug?: string;
  badgeColor?: string;
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

const QrOperations: React.FC<QrOperationsProps> = ({ hotelSlug }) => {
  // ─── Orders (restaurant pending) ─────────────
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);

  // ─── Requests (non-restaurant pending) ───────
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(true);

  // ─── Messages (TODO: backend kelganda ulanadi) ──
  const messagesCount = 0;

  // ─── Calls (barcha vaqt) ─────────────────────
  const [callsCount, setCallsCount] = useState<number>(0);
  const [callsLoading, setCallsLoading] = useState<boolean>(true);

  // ═══════════════════════════════════════════════════════
  // LOADERS
  // ═══════════════════════════════════════════════════════

  const loadCallStats = useCallback(async () => {
    try {
      const result = await getCallHistory('all', 200);
      if (result.success) {
        setCallsCount(result.total);
      }
    } catch (err) {
      console.warn('[QrOperations] Failed to load call stats:', err);
    } finally {
      setCallsLoading(false);
    }
  }, []);

  const loadOrdersAndRequests = useCallback(async () => {
    if (!hotelSlug) {
      setOrdersLoading(false);
      setRequestsLoading(false);
      return;
    }
    try {
      const result = await listRequests(hotelSlug, 'pending', 200);
      if (result.success && result.requests) {
        const orders = result.requests.filter(
          (r) => r.service_type === 'restaurant'
        ).length;
        const requests = result.requests.filter(
          (r) => r.service_type !== 'restaurant'
        ).length;
        setOrdersCount(orders);
        setRequestsCount(requests);
      }
    } catch (err) {
      console.warn('[QrOperations] Failed to load orders/requests:', err);
    } finally {
      setOrdersLoading(false);
      setRequestsLoading(false);
    }
  }, [hotelSlug]);

  // ═══════════════════════════════════════════════════════
  // Initial load + Socket real-time updates
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    // 1) Birinchi yuklash
    const initialLoad = async () => {
      if (cancelled) return;
      await Promise.all([loadCallStats(), loadOrdersAndRequests()]);
    };
    initialLoad();

    // 2) Socket event listenerlar (real-time)
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    // ── Calls ──
    const handleCallEnded = () => {
      if (cancelled) return;
      console.log('[QrOperations] 📡 call:ended — refresh calls');
      loadCallStats();
    };
    const handleNewCall = () => {
      if (cancelled) return;
      console.log('[QrOperations] 📡 new-call — refresh calls');
      loadCallStats();
    };

    // ── Orders + Requests ──
    const handleNewRequest = () => {
      if (cancelled) return;
      console.log('[QrOperations] 📡 new-request — refresh orders/requests');
      loadOrdersAndRequests();
    };
    const handleStatusChanged = () => {
      if (cancelled) return;
      console.log('[QrOperations] 📡 request:status_changed — refresh');
      loadOrdersAndRequests();
    };

    socket.on('call:ended', handleCallEnded);
    socket.on('new-call', handleNewCall);
    socket.on('new-request', handleNewRequest);
    socket.on('request:status_changed', handleStatusChanged);

    return () => {
      cancelled = true;
      socket.off('call:ended', handleCallEnded);
      socket.off('new-call', handleNewCall);
      socket.off('new-request', handleNewRequest);
      socket.off('request:status_changed', handleStatusChanged);
    };
  }, [loadCallStats, loadOrdersAndRequests]);

  return (
    <div className="qro-grid">
      <StatCard
        icon={ShoppingCart}
        value={ordersCount}
        label="Orders"
        color="#f97316"
        loading={ordersLoading}
        variant="compact"
      />
      <StatCard
        icon={ConciergeBell}
        value={requestsCount}
        label="Requests"
        color="#0ea5e9"
        loading={requestsLoading}
        variant="compact"
      />
      <StatCard
        icon={MessageCircle}
        value={messagesCount}
        label="Messages"
        color="#16a34a"
        variant="compact"
      />
      <StatCard
        icon={Phone}
        value={callsCount}
        label="Calls"
        color="#10b981"
        loading={callsLoading}
        variant="compact"
      />
    </div>
  );
};

export default QrOperations;