// src/pages/guest/components/GuestNotificationToast/GuestNotificationToast.tsx
import React, { useEffect, useState } from 'react';
import { Car, Bell, CheckCircle2, X } from 'lucide-react';
import './GuestNotificationToast.css';

export interface GuestNotification {
  id: string;
  service_type: string;
  message: string;
  timestamp: number;
}

interface GuestNotificationToastProps {
  notification: GuestNotification | null;
  accentColor: string;
  onDismiss: () => void;
}

const SERVICE_ICONS: Record<string, any> = {
  yandex_taxi: Car,
  default: CheckCircle2,
};

const GuestNotificationToast: React.FC<GuestNotificationToastProps> = ({
  notification,
  accentColor,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // wait for exit animation
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const Icon = SERVICE_ICONS[notification.service_type] || SERVICE_ICONS.default;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className={`gnt-overlay ${visible ? 'is-visible' : ''}`}>
      <div className="gnt-toast" onClick={handleClose}>
        <div className="gnt-icon" style={{ background: accentColor }}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div className="gnt-content">
          <div className="gnt-title">
            <Bell size={11} strokeWidth={2.4} />
            New Update
          </div>
          <div className="gnt-message">{notification.message}</div>
        </div>
        <button
          type="button"
          className="gnt-close"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

export default GuestNotificationToast;