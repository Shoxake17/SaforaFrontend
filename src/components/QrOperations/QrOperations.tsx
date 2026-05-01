// src/components/QrOperations/QrOperations.tsx
import React from 'react';
import {
  ShoppingCart,
  ConciergeBell,
  MessageCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import './QrOperations.css';

interface StatItem {
  key: string;
  icon: LucideIcon;
  label: string;
  color: string;
  value: number | string;
  loading?: boolean;
}

interface QrOperationsProps {
  hotelSlug?: string;
  badgeColor?: string;
  staffCount?: number;
  staffLoading?: boolean;
}

const QrOperations: React.FC<QrOperationsProps> = ({
  badgeColor = '#ef4444',
  staffCount = 0,
  staffLoading = false,
}) => {
  // 4 ta stat — staff real, qolganlari hozircha 0
  const stats: StatItem[] = [
    {
      key: 'staff',
      icon: Users,
      label: 'Active Staff',
      color: badgeColor,
      value: staffLoading ? '—' : staffCount,
      loading: staffLoading,
    },
    {
      key: 'orders',
      icon: ShoppingCart,
      label: 'Orders Today',
      color: '#f97316',
      value: 0,
    },
    {
      key: 'requests',
      icon: ConciergeBell,
      label: 'Requests Today',
      color: '#0ea5e9',
      value: 0,
    },
    {
      key: 'messages',
      icon: MessageCircle,
      label: 'Messages Today',
      color: '#16a34a',
      value: 0,
    },
  ];

  return (
    <div className="qro-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.key} className="qro-card">
            <div
              className="qro-icon"
              style={{
                color: stat.color,
                background: `${stat.color}15`,
              }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div className="qro-value">
              {stat.loading ? (
                <span className="qro-skeleton">—</span>
              ) : (
                stat.value
              )}
            </div>
            <div className="qro-label">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default QrOperations;