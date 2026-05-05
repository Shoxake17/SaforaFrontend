// src/components/QrOperations/QrOperations.tsx
// ⭐ SOCKET-ONLY VERSION — No polling, real-time updates
import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  ConciergeBell,
  MessageCircle,
  Phone,
} from 'lucide-react';
import StatCard from '@components/StatCard';
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

const QrOperations: React.FC<QrOperationsProps> = () => {
  // ═════ TODO: Backend API'lar bilan almashtirish ═════
  const ordersCount = 0;
  const requestsCount = 0;
  const messagesCount = 0;

  // ═════ Calls — BARCHA kun ═════
  const [callsCount, setCallsCount] = useState<number>(0);
  const [callsLoading, setCallsLoading] = useState<boolean>(true);

  // ═══════════════════════════════════════════════════════
  // Initial load + Socket-based real-time updates
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    const loadCallStats = async () => {
      try {
        const result = await getCallHistory('all', 200);
        if (cancelled) return;

        if (result.success) {
          setCallsCount(result.total);
        }
      } catch (err) {
        console.warn('[QrOperations] Failed to load call stats:', err);
      } finally {
        if (!cancelled) setCallsLoading(false);
      }
    };

    // 1) Birinchi yuklash
    loadCallStats();

    // 2) Socket event listener (real-time yangilanish)
    const token = tokenService.get();
    if (!token) return;

    const socket = getSocket(token);

    const handleCallEnded = () => {
      console.log('[QrOperations] 📡 call:ended — refreshing stats');
      loadCallStats();
    };

    const handleNewCall = () => {
      console.log('[QrOperations] 📡 new-call — refreshing stats');
      loadCallStats();
    };

    socket.on('call:ended', handleCallEnded);
    socket.on('new-call', handleNewCall);

    return () => {
      cancelled = true;
      socket.off('call:ended', handleCallEnded);
      socket.off('new-call', handleNewCall);
    };
  }, []);

  return (
    <div className="qro-grid">
      <StatCard
        icon={ShoppingCart}
        value={ordersCount}
        label="Orders"
        color="#f97316"
        variant="compact"
      />
      <StatCard
        icon={ConciergeBell}
        value={requestsCount}
        label="Requests"
        color="#0ea5e9"
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