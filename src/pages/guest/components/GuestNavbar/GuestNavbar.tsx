// src/pages/guest/components/GuestNavbar/GuestNavbar.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { GuestHotel } from '@apptypes/guest';
import { imageUrl } from '@utils/imageUrl';

import './GuestNavbar.css';

interface GuestNavbarProps {
  hotel: GuestHotel;
  accentColor: string;
  /** transparent — hero image ustida (oq matn) | solid — oq fon (qora matn) */
  variant?: 'transparent' | 'solid';
  /** Notification tugmasini ko'rsatish */
  showNotification?: boolean;
  /** Notification'da qizil nuqta (yangi xabar) */
  hasNotification?: boolean;
  /** Hotel nomini ko'rsatish (transparent variant uchun) */
  showHotelName?: boolean;
  onLanguageClick?: () => void;
  onNotificationClick?: () => void;
}

const GuestNavbar: React.FC<GuestNavbarProps> = ({
  hotel,
  accentColor,
  variant = 'solid',
  showNotification = true,
  hasNotification = false,
  showHotelName = false,
  onLanguageClick,
  onNotificationClick,
}) => {
  return (
    <div className={`gn-navbar gn-${variant}`}>
      {/* ═════ LOGO (left) ═════ */}
      <div className="gn-logo">
        
      
      </div>

      {/* ═════ HOTEL NAME (center) ═════ */}
      {showHotelName && (
        <div className="gn-hotel-name" title={hotel.name}>
          {hotel.name}
        </div>
      )}

      {/* ═════ ACTIONS (right) ═════ */}
      <div className="gn-actions">
        <button
          type="button"
          className="gn-lang-btn"
          onClick={onLanguageClick}
          aria-label="Change language"
        >
          EN <ChevronDown size={14} strokeWidth={2.2} />
        </button>

        
      </div>
    </div>
  );
};

export default GuestNavbar;