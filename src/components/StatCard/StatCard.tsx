// src/components/StatCard/StatCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './StatCard.css';

export interface StatCardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Asosiy son yoki matn */
  value: string | number;
  /** Karta tagidagi label */
  label: string;
  /** Icon va background rangi */
  color?: string;
  /** Loading holati — '—' ko'rsatiladi */
  loading?: boolean;
  /** Karta hajmi: 'default' (katta) yoki 'compact' (kichik) */
  variant?: 'default' | 'compact';
  /** Karta bosilganda */
  onClick?: () => void;
  /** Qo'shimcha CSS klass */
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  color = 'var(--orange)',
  loading = false,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);
  const displayValue = loading ? '—' : value;
  const iconSize = variant === 'compact' ? 18 : 20;

  return (
    <div
      className={`sc-card sc-${variant} ${isClickable ? 'sc-clickable' : ''} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div
        className="sc-icon"
        style={{
          color,
          background: `${color}15`,
        }}
      >
        <Icon size={iconSize} strokeWidth={2.2} />
      </div>

      <div className="sc-value">
        {loading ? (
          <span className="sc-skeleton" aria-label="Loading" />
        ) : (
          displayValue
        )}
      </div>

      <div className="sc-label">{label}</div>
    </div>
  );
};

export default StatCard;