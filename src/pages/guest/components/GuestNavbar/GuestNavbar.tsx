// src/pages/guest/components/GuestNavbar/GuestNavbar.tsx
import React from 'react';
import { ChevronDown, Bell } from 'lucide-react';
import type { GuestHotel } from '@apptypes/guest';
import { useGuestNotificationsContext } from '@contexts/GuestNotificationsContext';

import './GuestNavbar.css';

interface GuestNavbarProps {
  hotel: GuestHotel;
  accentColor: string;
  variant?: 'transparent' | 'solid';
  showNotification?: boolean;
  showHotelName?: boolean;
  onLanguageClick?: () => void;
}

const GuestNavbar: React.FC<GuestNavbarProps> = ({
  hotel,
  accentColor,
  variant = 'solid',
  showNotification = true,
  showHotelName = false,
  onLanguageClick,
}) => {
  // ⭐ Hook chaqirilmaydi — Context'dan o'qiymiz
  const { unreadCount, hasUnread, openPanel } = useGuestNotificationsContext();

  return (
    <div className={`gn-navbar gn-${variant}`}>
      {/* LOGO */}
      <div className="gn-logo">
        {/* Logo content here */}
      </div>

      {/* HOTEL NAME */}
      {showHotelName && (
        <div className="gn-hotel-name" title={hotel.name}>
          {hotel.name}
        </div>
      )}

      {/* ACTIONS */}
      <div className="gn-actions">
        <button
          type="button"
          className="gn-lang-btn"
          onClick={onLanguageClick}
          aria-label="Change language"
        >
          EN <ChevronDown size={14} strokeWidth={2.2} />
        </button>

        {/* ⭐ Bell — Context'dagi openPanel'ni chaqiradi */}
        {showNotification && (
          <button
            type="button"
            className="gn-notif-btn"
            onClick={openPanel}
            aria-label={
              hasUnread ? `Notifications (${unreadCount} unread)` : 'Notifications'
            }
          >
            <Bell size={18} strokeWidth={2.2} />
            {hasUnread && (
              <span
                className="gn-notif-badge"
                style={{ background: accentColor }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GuestNavbar;