// src/components/QrOperations/QrOperations.tsx
import React from 'react';
import { Users, ShoppingCart, ConciergeBell, MessageCircle } from 'lucide-react';
import StatCard from '@components/StatCard';
import './QrOperations.css';

interface QrOperationsProps {
  hotelSlug?: string;
  badgeColor: string;
  staffCount: number;
  staffLoading: boolean;
}

const QrOperations: React.FC<QrOperationsProps> = ({
  badgeColor,
  staffCount,
  staffLoading,
}) => {
  // TODO: real API'lar bilan almashtirish
  const ordersCount = 0;
  const requestsCount = 0;
  const messagesCount = 0;

  return (
    <div className="qro-grid">
      <StatCard
        icon={Users}
        value={staffCount}
        label="Active Staff"
        color={badgeColor}
        loading={staffLoading}
        variant="compact"            /* ← KICHIK */
      />
      <StatCard
        icon={ShoppingCart}
        value={ordersCount}
        label="Orders Today"
        color="#f97316"
        variant="compact"
      />
      <StatCard
        icon={ConciergeBell}
        value={requestsCount}
        label="Requests Today"
        color="#0ea5e9"
        variant="compact"
      />
      <StatCard
        icon={MessageCircle}
        value={messagesCount}
        label="Messages Today"
        color="#16a34a"
        variant="compact"
      />
    </div>
  );
};

export default QrOperations;