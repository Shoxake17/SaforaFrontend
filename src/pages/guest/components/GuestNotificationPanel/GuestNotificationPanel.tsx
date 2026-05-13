// src/pages/guest/components/GuestNotificationPanel/GuestNotificationPanel.tsx
import React, { useEffect } from 'react';
import {
  X,
  Check,
  XCircle,
  ShoppingBag,
  Car,
  Sparkles,
  Waves,
  Dumbbell,
  WashingMachine,
  AlarmClock,
  ConciergeBell,
  Bell,
  CheckCheck,
  Trash2,
  HandHelping,
} from 'lucide-react';
import type { GuestNotification } from '@hooks/useGuestNotifications';
import './GuestNotificationPanel.css';

const SERVICE_ICONS: Record<string, typeof Bell> = {
  restaurant:  ShoppingBag,
  yandex_taxi: Car,
  spa:         Sparkles,
  pool:        Waves,
  gym:         Dumbbell,
  laundry:     WashingMachine,
  wake_up:     AlarmClock,
  concierge:   ConciergeBell,
};

const SERVICE_COLORS: Record<string, string> = {
  restaurant:  '#f97316',
  yandex_taxi: '#eab308',
  spa:         '#a855f7',
  pool:        '#06b6d4',
  gym:         '#dc2626',
  laundry:     '#2563eb',
  wake_up:     '#f59e0b',
  concierge:   '#16a34a',
};

const formatTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
};

interface GuestNotificationPanelProps {
  open: boolean;
  notifications: GuestNotification[];
  unreadCount: number;
  accentColor: string;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

const GuestNotificationPanel: React.FC<GuestNotificationPanelProps> = ({
  open,
  notifications,
  unreadCount,
  accentColor,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  // Auto-mark read after short delay (user see unread state briefly)
  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(onMarkAllAsRead, 800);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="gnp-overlay" onClick={onClose} />
      <div className="gnp-panel" role="dialog" aria-label="Notifications">
        {/* Header */}
        <header className="gnp-header">
          <div className="gnp-title-wrap">
            <div
              className="gnp-title-icon"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <Bell size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div className="gnp-title">Notifications</div>
              {notifications.length > 0 && (
                <div className="gnp-subtitle">
                  {notifications.length} {notifications.length === 1 ? 'message' : 'messages'}
                  {unreadCount > 0 && ` · ${unreadCount} new`}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="gnp-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </header>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="gnp-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="gnp-action-btn"
                onClick={onMarkAllAsRead}
              >
                <CheckCheck size={13} strokeWidth={2.4} />
                Mark all read
              </button>
            )}
            <button
              type="button"
              className="gnp-action-btn gnp-action-danger"
              onClick={() => {
                if (window.confirm('Clear all notifications?')) onClearAll();
              }}
            >
              <Trash2 size={13} strokeWidth={2.4} />
              Clear
            </button>
          </div>
        )}

        {/* List */}
        <div className="gnp-list">
          {notifications.length === 0 ? (
            <div className="gnp-empty">
              <div
                className="gnp-empty-ico"
                style={{ background: `${accentColor}10`, color: accentColor }}
              >
                <Bell size={32} strokeWidth={1.5} />
              </div>
              <div className="gnp-empty-title">No notifications yet</div>
              <div className="gnp-empty-text">
                We'll notify you when your orders<br />or requests are updated
              </div>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = SERVICE_ICONS[notif.serviceType] || HandHelping;
              const color = SERVICE_COLORS[notif.serviceType] || accentColor;
              const isApproved = notif.type === 'approved';

              return (
                <div
                  key={notif.id}
                  className={`gnp-item ${!notif.read ? 'is-unread' : ''}`}
                  onClick={() => !notif.read && onMarkAsRead(notif.id)}
                >
                  <div
                    className="gnp-item-ico"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>

                  <div className="gnp-item-body">
                    <div className="gnp-item-head">
                      <div className="gnp-item-title">{notif.serviceLabel}</div>
                      <div
                        className={`gnp-item-status ${isApproved ? 'is-ok' : 'is-bad'}`}
                      >
                        {isApproved ? (
                          <>
                            <Check size={11} strokeWidth={2.8} />
                            Approved
                          </>
                        ) : (
                          <>
                            <XCircle size={11} strokeWidth={2.4} />
                            Cancelled
                          </>
                        )}
                      </div>
                    </div>

                    <div className="gnp-item-msg">{notif.message}</div>

                    <div className="gnp-item-time">{formatTime(notif.timestamp)}</div>
                  </div>

                  {!notif.read && (
                    <div className="gnp-item-dot" style={{ background: color }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default GuestNotificationPanel;