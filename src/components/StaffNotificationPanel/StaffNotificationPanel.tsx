// src/components/StaffNotificationPanel/StaffNotificationPanel.tsx
import React, { useEffect } from 'react';
import { X, Bell, Megaphone, Trash2, CheckCheck } from 'lucide-react';
import { useStaffNotificationsContext } from '@contexts/StaffNotificationsContext';
import './StaffNotificationPanel.css';

const formatTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
};

const StaffNotificationPanel: React.FC = () => {
  const {
    notifications,
    unreadCount,
    panelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useStaffNotificationsContext();

  // Auto-mark read after short delay
  useEffect(() => {
    if (panelOpen && unreadCount > 0) {
      const t = setTimeout(markAllAsRead, 1000);
      return () => clearTimeout(t);
    }
  }, [panelOpen, unreadCount, markAllAsRead]);

  if (!panelOpen) return null;

  return (
    <>
      <div className="snp-overlay" onClick={closePanel} />
      <div className="snp-panel">
        <header className="snp-header">
          <div className="snp-title-wrap">
            <div className="snp-title-icon">
              <Bell size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="snp-title">Staff Notifications</div>
              <div className="snp-subtitle">
                {notifications.length} total · {unreadCount} new
              </div>
            </div>
          </div>
          <button className="snp-close" onClick={closePanel}>
            <X size={20} />
          </button>
        </header>

        <div className="snp-actions">
          {unreadCount > 0 && (
            <button className="snp-action-btn" onClick={markAllAsRead}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button className="snp-action-btn snp-danger" onClick={() => window.confirm('Clear all?') && clearAll()}>
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <div className="snp-list">
          {notifications.length === 0 ? (
            <div className="snp-empty">
              <Bell size={40} strokeWidth={1} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`snp-item ${!n.read ? 'is-unread' : ''}`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className="snp-item-ico">
                  <Megaphone size={18} />
                </div>
                <div className="snp-item-body">
                  <div className="snp-item-head">
                    <span className="snp-item-title">{n.title}</span>
                    <span className="snp-item-time">{formatTime(n.timestamp)}</span>
                  </div>
                  <p className="snp-item-msg">{n.message}</p>
                </div>
                {!n.read && <div className="snp-unread-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default StaffNotificationPanel;
