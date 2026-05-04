// src/components/QrOperations/QrOperations.tsx
import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  ConciergeBell,
  MessageCircle,
  Phone,
} from 'lucide-react';
import StatCard from '@components/StatCard';
import { getCallHistory } from '@services/calls';
import './QrOperations.css';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface QrOperationsProps {
  hotelSlug?: string;
  badgeColor?: string;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

/** Stats avtomatik yangilanadigan interval (ms) */
const STATS_REFRESH_INTERVAL_MS = 30_000;

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

const QrOperations: React.FC<QrOperationsProps> = () => {
  // ═════ TODO: Backend API'lar bilan almashtirish ═════
  const ordersCount = 0;
  const requestsCount = 0;
  const messagesCount = 0;

  // ═════ Calls — BARCHA kun (history bilan bir xil) ═════
  const [callsCount, setCallsCount] = useState<number>(0);
  const [callsLoading, setCallsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const loadCallStats = async () => {
      try {
        // ✅ getCallHistory ishlatamiz (Call History TOTAL bilan bir xil)
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

    loadCallStats();

    const interval = setInterval(loadCallStats, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
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