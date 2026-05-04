// src/pages/guest/tabs/HomeTab/HomeTab.tsx
import React, { useState } from 'react';
import {
  PhoneOutgoing,
  MessageCircleMore,
  BotMessageSquare,
  ConciergeBell,
  Hand,
  MapPinned,
  Hotel as HotelIcon,
  BedDouble,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

import CallModal from '../../modals/CallModal';
import { useWeather } from '../../hooks/useWeather';

import './HomeTab.css';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
type ActionKey = 'call' | 'message' | 'ai' | 'services' | 'request' | 'explore';

interface HomeTabProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
  accentColor: string;
  onTabChange?: (tab: 'services' | 'explore') => void;
}

// ═══════════════════════════════════════════════════════
// Storage Constants — useGuestCall.ts bilan bir xil bo'lishi kerak
// ═══════════════════════════════════════════════════════
const STORAGE_KEY = 'safora_active_call';
const RECONNECT_TIMEOUT_MS = 60000; // 60 sek

// ═══════════════════════════════════════════════════════
// Helper — localStorage'da active call bormi tekshirish
// (Refresh'dan keyin CallModal'ni avtomatik ochish uchun)
// ═══════════════════════════════════════════════════════
const checkActiveCallInStorage = (
  hotelSlug: string,
  roomNumber: string,
  guestName: string
): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);

    // Eski (60 sek dan eski) bo'lsa, tozalash
    if (Date.now() - data.startedAt > RECONNECT_TIMEOUT_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    // Bir xil hotel/room/guest bo'lishi kerak
    if (
      data.hotelSlug !== hotelSlug ||
      data.roomNumber !== roomNumber ||
      data.guestName !== guestName
    ) {
      return false;
    }

    console.log('[HomeTab] Active call found in storage, auto-opening CallModal');
    return true;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════
// Action Cards
// ═══════════════════════════════════════════════════════
const ACTION_CARDS: {
  key: ActionKey;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  // { key: 'call',     icon: PhoneOutgoing,     label: 'Call',         color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { key: 'call',    icon: PhoneOutgoing,     label: 'Calls',         color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { key: 'message',  icon: MessageCircleMore, label: 'Message',      color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' },
  { key: 'ai',       icon: BotMessageSquare,  label: 'AI Concierge', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  { key: 'services', icon: ConciergeBell,     label: 'Services',     color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' },
  { key: 'request',  icon: Hand,              label: 'Request',      color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { key: 'explore',  icon: MapPinned,         label: 'Explore',      color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' },
];

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════
const HomeTab: React.FC<HomeTabProps> = ({
  hotel,
  room,
  settings,
  guestName,
  accentColor,
  onTabChange,
}) => {
  // ✅ REAL Weather (Open-Meteo API'dan)
  const weather = useWeather(hotel.city || 'Tashkent');

  // ═══════════════════════════════════════════════════
  // ✅ Modal states — Refresh'dan keyin avtomatik ochish
  // localStorage'da active call bo'lsa, CallModal o'z-o'zidan ochiladi
  // ═══════════════════════════════════════════════════
  const [showCallModal, setShowCallModal] = useState<boolean>(() =>
    checkActiveCallInStorage(hotel.slug, room.number, guestName)
  );

  const welcomeSubtitle =
    settings.welcome_subtitle || 'We are here to make your stay exceptional.';

  // Action click handler
  const handleActionClick = (key: ActionKey) => {
    switch (key) {
      case 'call':
        setShowCallModal(true);
        break;
      case 'message':
        if (settings.whatsapp) {
          window.open(`https://wa.me/${settings.whatsapp}`, '_blank');
        }
        break;
      case 'ai':
        console.log('AI Concierge — Bosqich 2');
        break;
      case 'services':
        onTabChange?.('services');
        break;
      case 'request':
        console.log('Request — Bosqich 2');
        break;
      case 'explore':
        onTabChange?.('explore');
        break;
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="ht-header">
        <div
          className="ht-logo-wrap"
          style={{
            borderColor: `${accentColor}20`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.04), 0 12px 40px ${accentColor}15`,
          }}
        >
          {hotel.logo ? (
            <img src={hotel.logo} alt={hotel.name} className="ht-logo-img" />
          ) : (
            <div
              className="ht-logo-fallback"
              style={{ background: `${accentColor}12` }}
            >
              <HotelIcon size={18} color={accentColor} strokeWidth={2.2} />
            </div>
          )}
        </div>

        <h1 className="ht-hotel-name">{hotel.name}</h1>

        <div className="ht-meta">
          <div className="ht-weather">
            <span className="ht-weather-emoji">{weather.emoji}</span>
            <span className="ht-weather-temp">{weather.temp}°C</span>
            <span className="ht-weather-dot">·</span>
            <span className="ht-weather-desc">{weather.description}</span>
          </div>

          <div className="ht-room-chip">
            <BedDouble size={13} strokeWidth={2.2} />
            <span>Room {room.number}</span>
          </div>
        </div>
      </div>

      {/* WELCOME */}
      <div className="ht-welcome">
        <h2 className="ht-welcome-title" style={{ color: accentColor }}>
          Welcome, {guestName}
        </h2>
        <p className="ht-welcome-subtitle">{welcomeSubtitle}</p>
      </div>

      {/* ACTION CARDS */}
      <div className="ht-actions-grid">
        {ACTION_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              className="ht-action-card"
              onClick={() => handleActionClick(card.key)}
            >
              <div
                className="ht-action-icon"
                style={{ background: card.bgColor }}
              >
                <Icon size={18} color={card.color} strokeWidth={2.2} />
              </div>
              <span className="ht-action-label">{card.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTACT DIVIDER */}
      <div className="ht-contact-divider">
        <span className="ht-divider-line" style={{ background: accentColor }} />
        <span className="ht-divider-text">CONTACT</span>
      </div>

      {/* MODALS */}
      {showCallModal && (
        <CallModal
          isOpen={true}
          onClose={() => setShowCallModal(false)}
          hotelName={hotel.name}
          hotelSlug={hotel.slug}
          phone={settings.phone}
          whatsapp={settings.whatsapp}
          accentColor={accentColor}
          guestName={guestName}
          roomNumber={room.number}
        />
      )}
    </>
  );
};

export default HomeTab;