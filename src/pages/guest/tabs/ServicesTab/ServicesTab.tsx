// src/pages/guest/tabs/ServicesTab/ServicesTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, SlidersHorizontal, MapPin, ChevronRight, BedDouble,
} from 'lucide-react';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import GuestNavbar from '../../components/GuestNavbar/GuestNavbar';
import { useWeather } from '../../hooks/useWeather';
import { imageUrl } from '@utils/imageUrl';
import { HOTEL_SERVICES, type HotelServiceDef } from '@constants/hotelServices';
import WifiModal from '../../modals/WifiModal/WifiModal';
import ServiceViewModal from '../../modals/ServiceViewModal/ServiceViewModal';
import './ServicesTab.css';

interface ServicesTabProps {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  guestName: string;
  accentColor: string;
  onTabChange?: (tab: 'explore') => void;
  onCallClick?: () => void;
}

const CAROUSEL_INTERVAL_MS = 4500;

const ServicesTab: React.FC<ServicesTabProps> = ({
  hotel,
  room,
  settings,
  guestName,
  accentColor,
  onTabChange,
  onCallClick,
}) => {
  const weather = useWeather(hotel.city || 'Tashkent');
  const [search, setSearch] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Modals
  const [showWifiModal, setShowWifiModal] = useState(false);
  // ⭐ Universal active view modal — qaysi service ekanini ushlab turadi
  const [activeViewService, setActiveViewService] = useState<HotelServiceDef | null>(null);

  const coverPhotos = (settings.cover_photos && settings.cover_photos.length > 0)
    ? settings.cover_photos
    : null;

  useEffect(() => {
    if (!coverPhotos || coverPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % coverPhotos.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [coverPhotos]);

  const filteredServices = useMemo(() => {
    const enabled = settings.active_services || [];
    let services = HOTEL_SERVICES.filter((s) => enabled.includes(s.key));

    if (search.trim()) {
      const q = search.toLowerCase();
      services = services.filter(
        (s) => s.title.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
      );
    }

    return services;
  }, [search, settings.active_services]);

  const firstName = guestName.split(' ')[0] || guestName;

  // ⭐ Universal click handler
  const handleServiceClick = (service: HotelServiceDef) => {
    if (service.key === 'wifi') {
      setShowWifiModal(true);
      return;
    }
    if (service.hasDetails) {
      // Gym, Spa, Pool, Laundry — universal view modal
      setActiveViewService(service);
      return;
    }
    if (service.key === 'roomService' || service.key === 'concierge') {
      onCallClick?.();
      return;
    }
    console.log(`Service clicked: ${service.key}`);
  };

  const wifiNetworks = Array.isArray(settings.wifi) ? settings.wifi : [];

  // ⭐ Active service detail — dynamic
  const getActiveDetail = () => {
    if (!activeViewService) return {};
    return (settings as any)[activeViewService.key] || {};
  };

  return (
    <div className="sv-screen">
      {/* HERO */}
      <div className="sv-hero">
        {coverPhotos ? (
          <div className="sv-hero-carousel">
            {coverPhotos.map((photo, idx) => (
              <img
                key={idx}
                className={`sv-hero-bg ${idx === currentPhoto ? 'active' : ''}`}
                src={imageUrl(photo.url)}
                alt={`${hotel.name} ${idx + 1}`}
              />
            ))}
          </div>
        ) : (
          <img
            className="sv-hero-bg active"
            src={settings.hero_photo || '/avant.png'}
            alt={hotel.name}
          />
        )}

        <div className="sv-hero-overlay" />

        <div className="sv-hero-content">
          <GuestNavbar
            hotel={hotel}
            accentColor={accentColor}
            variant="transparent"
            showHotelName={false}
            hasNotification={false}
          />

          <div className="sv-greeting">
            <div className="sv-greet-small">Welcome back,</div>
            <h1 className="sv-greet-name">{firstName}</h1>
          </div>

          {(hotel.city || hotel.country) && (
            <div className="sv-location">
              <MapPin size={14} strokeWidth={2.2} />
              <span>
                {hotel.city}{hotel.country ? `, ${hotel.country}` : ''}
              </span>
            </div>
          )}

          <div className="sv-chips">
            <div className="sv-chip">
              <div
                className="sv-chip-icon"
                style={{ background: `${accentColor}1a`, color: accentColor }}
              >
                <span className="sv-chip-emoji">{weather.emoji}</span>
              </div>
              <div className="sv-chip-text">
                <div className="sv-chip-title">{weather.temp}°C</div>
                <div className="sv-chip-sub">{weather.description}</div>
              </div>
            </div>

            <div className="sv-chip">
              <div
                className="sv-chip-icon"
                style={{ background: `${accentColor}1a`, color: accentColor }}
              >
                <BedDouble size={16} strokeWidth={2.2} />
              </div>
              <div className="sv-chip-text">
                <div className="sv-chip-title">Room {room.number}</div>
                <div className="sv-chip-sub">{room.room_type_name || 'Standard'}</div>
              </div>
            </div>
          </div>
        </div>

        {coverPhotos && coverPhotos.length > 1 && (
          <div className="sv-hero-dots">
            {coverPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`sv-hero-dot ${idx === currentPhoto ? 'active' : ''}`}
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

      {/* SECTION HEAD */}
      <div className="sv-section">
        <div className="sv-section-head">
          <h2 className="sv-section-title">Our Services</h2>
        </div>
      </div>

      {/* SEARCH */}
      <div className="sv-search-wrap">
        <div className="sv-search">
          <Search size={18} strokeWidth={2.2} className="sv-search-icon" />
          <input
            type="text"
            className="sv-search-input"
            placeholder="Search services or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="sv-filter-btn" style={{ color: accentColor }}>
            <SlidersHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* SERVICES GRID */}
      {filteredServices.length > 0 ? (
        <div className="sv-section">
          <div className="sv-grid-3">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.key}
                  type="button"
                  className="sv-service-card"
                  onClick={() => handleServiceClick(service)}
                >
                  <div
                    className="sv-service-icon"
                    style={{ color: service.color || accentColor }}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <div className="sv-service-title">{service.title}</div>
                  <div className="sv-service-sub">{service.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="sv-empty">
          <Search size={36} strokeWidth={1.5} />
          <p>{search ? 'No services found' : 'No active services'}</p>
          <small>
            {search
              ? 'Try a different search term'
              : 'Hotel manager has not enabled any services yet'}
          </small>
        </div>
      )}

      {/* FEATURED BANNER */}
      <div className="sv-featured">
        <img
          className="sv-featured-bg"
          src={settings.hero_photo || (coverPhotos?.[0] ? imageUrl(coverPhotos[0].url) : '/avant.png')}
          alt=""
        />
        <div className="sv-featured-overlay" />

        <div className="sv-featured-content">
          <div className="sv-featured-tag" style={{ color: accentColor }}>
            EXPERIENCE COMFORT
          </div>
          <h2 className="sv-featured-title">
            Luxury, Comfort
            <br />& Wellness
          </h2>
          <p className="sv-featured-desc">
            Experience the perfect blend of relaxation and elegance during your stay.
          </p>
          <button
            type="button"
            className="sv-featured-btn"
            style={{ background: accentColor }}
            onClick={() => onTabChange?.('explore')}
          >
            Explore Hotel
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* WIFI MODAL */}
      {showWifiModal && (
        <WifiModal
          isOpen={showWifiModal}
          onClose={() => setShowWifiModal(false)}
          wifiNetworks={wifiNetworks}
          accentColor={accentColor}
        />
      )}

      {/* ⭐ UNIVERSAL SERVICE VIEW MODAL — Gym, Spa, Pool, Laundry */}
      {activeViewService && (
        <ServiceViewModal
          isOpen={!!activeViewService}
          onClose={() => setActiveViewService(null)}
          serviceTitle={activeViewService.title}
          serviceColor={activeViewService.color}
          serviceIcon={activeViewService.icon}
          detail={getActiveDetail()}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

export default ServicesTab;