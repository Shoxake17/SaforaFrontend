// src/components/EmptyStateCard/EmptyStateCard.tsx
import React, { type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import './EmptyStateCard.css';

export interface EmptyStateCardProps {
  headerIcon: LucideIcon;
  title: string;
  message: string;
  subMessage?: string;
  emptyIcon?: LucideIcon;
  accentColor?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  headerIcon: HeaderIcon,
  title,
  message,
  subMessage,
  emptyIcon: EmptyIcon = Inbox,
  accentColor = 'var(--orange)',
  action,
  children,
  className = '',
}) => {
  return (
    <div className={`esc-card ${className}`}>
      {/* Header */}
      <div className="esc-header">
        <HeaderIcon size={16} strokeWidth={2.2} style={{ color: accentColor }} />
        <span className="esc-title">{title}</span>
        {action && <div className="esc-header-action">{action}</div>}
      </div>

      {/* Body — agar children bo'lsa, uni ko'rsatadi, aks holda empty state */}
      <div className="esc-body">
        {children ? (
          children
        ) : (
          <div className="esc-empty">
            <EmptyIcon size={32} strokeWidth={1.6} className="esc-empty-icon" />
            <p className="esc-message">{message}</p>
            {subMessage && <span className="esc-sub">{subMessage}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyStateCard;