// src/pages/guest/tabs/HomeTab/HomeTab.tsx
import React, { useEffect, useState } from 'react';
import {
  MapPin,
  ShieldAlert,
  BedDouble,
  ArrowRight,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import GuestNavbar from '../../components/GuestNavbar/GuestNavbar';
import CallModal from '../../modals/CallModal';
import { useWeather } from '../../hooks/useWeather';
import { imageUrl } from '@utils/imageUrl';

import './HomeTab.css';

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
const CAROUSEL_INTERVAL_MS = 4500;

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

// ⭐ 5 ta bento card — public papkadagi local rasmlar
// Fayllar joylashuvi: SaforaFrontend/public/services/...
interface BentoCard {
  key: string;
  title: string;
  sub: string;
  image: string;
  tab: 'services' | 'explore';
  isLarge?: boolean;
}

const BENTO_CARDS: BentoCard[] = [
  {
    key: 'rooms',
    title: 'Safora AI',
    sub: '',
    image: '/services/saforaai.png',
    tab: 'services',
    isLarge: true,
  },
  {
    key: 'taxi',
    title: 'Taxi & Transport',
    sub: '',
    image: '/services/taxi.png',
    tab: 'services',
  },
  {
    key: 'dining',
    title: 'Restaurant',
    sub: '',
    image: '/services/restaurant.png',
    tab: 'services',
  },
  {
    key: 'exchange',
    title: 'Exchange',
    sub: "",
    image: '/services/concierge.jpg',
    tab: 'services',
  },
  {
    key: 'market',
    title: 'Market',
    sub: '',
    image: '/services/market.png',
    tab: 'explore',
  },
];

// ⭐ Agar rasm yo'q bo'lsa — fallback (avant.png yoki gradient)
const FALLBACK_IMAGE = '/avant.png';

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

  const [currentPhoto, setCurrentPhoto] = useState(0);

  const coverPhotos =
    settings.cover_photos && settings.cover_photos.length > 0
      ? settings.cover_photos
      : null;

  useEffect(() => {
    if (!coverPhotos || coverPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % coverPhotos.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [coverPhotos]);

  const firstName = guestName.split(' ')[0] || guestName;

  // ⭐ Rasm yuklanmasa — fallback ko'rsatish
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.endsWith(FALLBACK_IMAGE)) return; // loop'dan saqlanish
    img.src = FALLBACK_IMAGE;
  };

  return (
    <div className="ht-screen">
      {/* ═══════════════ HERO — CAROUSEL ═══════════════ */}
      <div className="ht-hero">
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
          />

          <div className="ht-greeting">
            <div className="ht-greet-small">Welcome back,</div>
            <h1 className="ht-greet-name">{firstName}</h1>
          </div>

          {(hotel.city || hotel.country) && (
            <div className="ht-location">
              <MapPin size={14} strokeWidth={2.2} />
              <span>
                {hotel.city}
                {hotel.country ? `, ${hotel.country}` : ''}
              </span>
            </div>
          )}

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
                <div className="ht-chip-sub">
                  {room.room_type_name || 'Standard'}
                </div>
              </div>
            </div>
          </div>
        </div>

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

      {/* ═══════════════ BENTO SERVICE GRID — LOCAL RASMLAR ═══════════════ */}
      <div className="ht-bento">
        {BENTO_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`ht-bento-card ${card.isLarge ? 'ht-bento-large' : ''}`}
            onClick={() => onTabChange?.(card.tab)}
          >
            <img
              className="ht-bento-img"
              src={card.image}
              alt={card.title}
              loading="lazy"
              onError={handleImageError}
            />
            <div className="ht-bento-overlay" />
            <div className="ht-bento-content">
              <h3 className="ht-bento-title">{card.title}</h3>
              <p className="ht-bento-sub">{card.sub}</p>
            </div>
            <div className="ht-bento-arrow">
              <ArrowRight size={15} strokeWidth={2.6} color="#1f2937" />
            </div>
          </button>
        ))}
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

      {/* ═══════════════ CALL MODAL (active call resume) ═══════════════ */}
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