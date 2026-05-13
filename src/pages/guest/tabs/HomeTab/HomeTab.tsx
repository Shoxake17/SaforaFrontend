// src/pages/guest/tabs/HomeTab/HomeTab.tsx
import React, { useEffect, useState } from 'react';
import {
  PhoneOutgoing,
  MessageCircleMore,
  Bot,
  ConciergeBell,
  BrushCleaning,
  Bell,
  MapPin,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  BedDouble,
  Ban,
  MapPinned,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import GuestNavbar from '../../components/GuestNavbar/GuestNavbar';
import CallModal from '../../modals/CallModal';
import { useWeather } from '../../hooks/useWeather';
import { imageUrl } from '@utils/imageUrl';

import './HomeTab.css';

type ActionKey = 'call' | 'message' | 'ai';
type ServiceKey = 'roomService' | 'request' | 'explore';

interface HomeTabProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
  accentColor: string;
  onTabChange?: (tab: 'services' | 'explore') => void;
}

const STORAGE_KEY = 'safora_active_call';
const RECONNECT_TIMEOUT_MS = 60000;
const CAROUSEL_INTERVAL_MS = 4500;  // ⭐ Carousel almashinuv vaqti

const checkActiveCallInStorage = (
  hotelSlug: string,
  roomNumber: string,
  guestName: string
): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (Date.now() - data.startedAt > RECONNECT_TIMEOUT_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    if (
      data.hotelSlug !== hotelSlug ||
      data.roomNumber !== roomNumber ||
      data.guestName !== guestName
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const COMM_CARDS = [
  { key: 'call' as ActionKey,    icon: PhoneOutgoing,     title: 'Call',         sub: 'Quick connect' },
  { key: 'message' as ActionKey, icon: MessageCircleMore, title: 'Message',      sub: 'Chat with us' },
  { key: 'ai' as ActionKey,      icon: Bot,               title: 'AI Concierge', sub: 'Smart assistant' },
];

const SERVICE_CARDS = [
  { key: 'roomService' as ServiceKey, icon: ConciergeBell, title: 'Restaurant', sub: '24/7' },
  { key: 'request' as ServiceKey,     icon: BrushCleaning, title: 'Request',      sub: 'Daily' },
  { key: 'explore' as ServiceKey,     icon: MapPinned,     title: 'Explore',      sub: 'Relax time' },
];

const HomeTab: React.FC<HomeTabProps> = ({
  hotel,
  room,
  settings,
  guestName,
  accentColor,
  onTabChange,
}) => {
  const weather = useWeather(hotel.city || 'Tashkent');

  const [showCallModal, setShowCallModal] = useState<boolean>(() =>
    checkActiveCallInStorage(hotel.slug, room.number, guestName)
  );

  // ⭐ YANGI — Carousel state
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // ⭐ Cover photos array (fallback'lar bilan)
  const coverPhotos = (settings.cover_photos && settings.cover_photos.length > 0)
    ? settings.cover_photos
    : null;

  // ⭐ Auto-cycle carousel
  useEffect(() => {
    if (!coverPhotos || coverPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % coverPhotos.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [coverPhotos]);

  const handleCommClick = (key: ActionKey) => {
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
        console.log('AI Concierge — coming soon');
        break;
    }
  };

  const handleServiceClick = (key: ServiceKey) => {
    if (key === 'explore') {
      onTabChange?.('explore');
    } else {
      onTabChange?.('services');
    }
  };

  const firstName = guestName.split(' ')[0] || guestName;

  return (
    <div className="ht-screen">
      {/* ═══════════════ HERO — CAROUSEL ═══════════════ */}
      <div className="ht-hero">
        {/* ⭐ YANGI — Carousel rasmlari */}
        {coverPhotos ? (
          <div className="ht-hero-carousel">
            {coverPhotos.map((photo, idx) => (
              <img
                key={idx}
                className={`ht-hero-bg ${idx === currentPhoto ? 'active' : ''}`}
                src={imageUrl(photo.url)}
                alt={`${hotel.name} ${idx + 1}`}
              />
            ))}
          </div>
        ) : (
          // Fallback — eski hero_photo yoki default
          <img
            className="ht-hero-bg active"
            src={settings.hero_photo || '/avant.png'}
            alt={hotel.name}
          />
        )}

        <div className="ht-hero-overlay" />

        <div className="ht-hero-content">
<GuestNavbar
  hotel={hotel}
  accentColor={accentColor}
  variant="transparent"
  showHotelName={false}
  hasNotification={false}
/>

          {/* Greeting */}
          <div className="ht-greeting">
            <div className="ht-greet-small">Welcome back,</div>
            <h1 className="ht-greet-name">{firstName}</h1>
          </div>

          {/* Location */}
          {(hotel.city || hotel.country) && (
            <div className="ht-location">
              <MapPin size={14} strokeWidth={2.2} />
              <span>
                {hotel.city}
                {hotel.country ? `, ${hotel.country}` : ''}
              </span>
            </div>
          )}

          {/* Info chips */}
          <div className="ht-chips">
            <div className="ht-chip">
              <div
                className="ht-chip-icon"
                style={{ background: `${accentColor}1a`, color: accentColor }}
              >
                <span className="ht-chip-emoji">{weather.emoji}</span>
              </div>
              <div className="ht-chip-text">
                <div className="ht-chip-title">{weather.temp}°C</div>
                <div className="ht-chip-sub">{weather.description}</div>
              </div>
            </div>

            <div className="ht-chip">
              <div
                className="ht-chip-icon"
                style={{ background: `${accentColor}1a`, color: accentColor }}
              >
                <BedDouble size={16} strokeWidth={2.2} />
              </div>
              <div className="ht-chip-text">
                <div className="ht-chip-title">Room {room.number}</div>
                <div className="ht-chip-sub">{room.room_type_name || 'Standard'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ YANGI — Carousel pagination dots */}
        {coverPhotos && coverPhotos.length > 1 && (
          <div className="ht-hero-dots">
            {coverPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`ht-hero-dot ${idx === currentPhoto ? 'active' : ''}`}
                onClick={() => setCurrentPhoto(idx)}
                aria-label={`Photo ${idx + 1}`}
                style={
                  idx === currentPhoto
                    ? { background: '#fff' }
                    : { background: 'rgba(255,255,255,0.4)' }
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ HOTEL RULES ═══════════════ */}
      {settings.hotel_rules && (
        <div className="ht-rules">
          <div
            className="ht-rules-icon"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            <ShieldAlert size={20} strokeWidth={2.2} />
          </div>
          <div className="ht-rules-content">
            <div className="ht-rules-title" style={{ color: accentColor }}>
              HOTEL RULES
            </div>
            <div
              className="ht-rules-text"
              dangerouslySetInnerHTML={{
                __html: (settings.hotel_rules || '').replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════ COMMUNICATION ═══════════════ */}
      <div className="ht-section">
        <div className="ht-section-head">
          <h2 className="ht-section-title">Our Services</h2>
          <button
            type="button"
            className="ht-view-all"
            style={{ color: accentColor }}
            onClick={() => onTabChange?.('services')}
          >
            View all <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div className="ht-grid-3">
          {COMM_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                className="ht-comm-card"
                onClick={() => handleCommClick(card.key)}
              >
                <div className="ht-comm-icon" style={{ color: accentColor }}>
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <div className="ht-service-title">{card.title}</div>
                <div className="ht-service-sub">{card.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ OUR SERVICES ═══════════════ */}
      <div className="ht-section">
        <div className="ht-grid-3">
          {SERVICE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                className="ht-service-card"
                onClick={() => handleServiceClick(card.key)}
              >
                <div className="ht-service-icon" style={{ color: accentColor }}>
                  <Icon size={26} strokeWidth={1.8} />
                </div>
                <div className="ht-service-title">{card.title}</div>
                <div className="ht-service-sub">{card.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ FEATURED BANNER ═══════════════ */}
      <div className="ht-featured">
        <img
          className="ht-featured-bg"
          src={settings.hero_photo || (coverPhotos?.[0] ? imageUrl(coverPhotos[0].url) : '/avant.png')}
          alt=""
        />
        <div className="ht-featured-overlay" />

        <div className="ht-featured-content">
          <div className="ht-featured-tag" style={{ color: accentColor }}>
            EXPERIENCE COMFORT
          </div>
          <h2 className="ht-featured-title">
            Luxury, Comfort
            <br />& Wellness
          </h2>
          <p className="ht-featured-desc">
            Experience the perfect blend of relaxation and elegance during your stay.
          </p>
          <button
            type="button"
            className="ht-featured-btn"
            style={{ background: accentColor }}
            onClick={() => onTabChange?.('explore')}
          >
            Explore Hotel
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}
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
    </div>
  );
};

export default HomeTab;