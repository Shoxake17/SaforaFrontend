// src/pages/guest/tabs/ExploreTab/ExploreTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, SlidersHorizontal, MapPin, Map, Heart, ArrowRight,
  LayoutGrid, Camera, Utensils, ShoppingBag, Landmark, Bus, Clock,
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import type { GuestHotel, GuestSettings } from '@apptypes/guest';
import { imageUrl } from '@utils/imageUrl';
import { calculateDistance, formatDistance } from '@utils/distance';
import GuestNavbar from '../../components/GuestNavbar/GuestNavbar';
import './ExploreTab.css';

interface ExploreTabProps {
  hotel: GuestHotel;
  settings: GuestSettings;
  accentColor: string;
}

const CATEGORIES = [
  { key: 'all',         label: 'All',         icon: LayoutGrid,  matches: null as string[] | null },
  { key: 'attractions', label: 'Attractions', icon: Camera,      matches: ['attraction', 'landmark'] },
  { key: 'dining',      label: 'Restaurant',      icon: Utensils,    matches: ['restaurant', 'cafe'] },
  { key: 'shopping',    label: 'Shopping',    icon: ShoppingBag, matches: ['shopping'] },
  { key: 'transport',   label: 'Transport',   icon: Bus,         matches: ['transport'] },
];

const CATEGORY_LABELS: Record<string, string> = {
  landmark: 'Attraction',
  attraction: 'Attraction',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  shopping: 'Shopping',
  culture: 'Cultural Site',
  transport: 'Transport',
};

const ExploreTab: React.FC<ExploreTabProps> = ({ hotel, settings, accentColor }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // ⭐ YANGI — User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const recommendations = settings.tourist_recommendations || [];

  // ⭐ GPS olish
  useEffect(() => {
    const getLocation = async () => {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') return;

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch (err) {
        console.warn('[ExploreTab] Location not available:', err);
      }
    };
    getLocation();
  }, []);

  // ⭐ Distance bilan recommendations
  const recsWithDistance = useMemo(() => {
    return recommendations.map((rec, idx) => {
      let distance: number | null = null;
      if (userLocation && rec.latitude && rec.longitude) {
        distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          rec.latitude, rec.longitude
        );
      }
      return { ...rec, distance, _idx: idx };
    });
  }, [recommendations, userLocation]);

  // ⭐ Filter + sort by distance
  const filtered = useMemo(() => {
    let result = [...recsWithDistance];

    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.key === activeCategory);
      if (cat?.matches) {
        result = result.filter((r) => cat.matches!.includes(r.category));
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q)
      );
    }

    // ⭐ Eng yaqin joylar boshida
    result.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return result;
  }, [recsWithDistance, activeCategory, search]);

  const toggleFavorite = (idx: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleViewDetails = (link: string) => {
    if (link) window.open(link, '_blank');
  };

  const handleExploreMap = () => {
    const query = `${hotel.city || 'Tashkent'}, ${hotel.country || ''}`;
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
      '_blank'
    );
  };

  return (
    <div className="ex-screen">
      <div className="ex-header">
        <div className="ex-header-top">
          <GuestNavbar
            hotel={hotel}
            accentColor={accentColor}
            variant="solid"
            hasNotification={true}
          />
        </div>

        <h1 className="ex-title">
          <span style={{ color: accentColor }}>Explore</span> Nearby
        </h1>
        <p className="ex-subtitle">
          Discover the best places near {hotel.name}
        </p>
      </div>

      <div className="ex-search-wrap">
        <div className="ex-search">
          <Search size={18} strokeWidth={2.2} className="ex-search-icon" />
          <input
            type="text"
            className="ex-search-input"
            placeholder="Search places, attractions, restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="ex-filter-btn" style={{ color: accentColor }}>
            <SlidersHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="ex-categories-wrap">
        <div className="ex-categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`ex-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                style={isActive ? {
                  background: `${accentColor}15`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                } : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ex-section-head">
        <div>
          <h2 className="ex-section-title">
            <MapPin size={16} strokeWidth={2.4} style={{ color: accentColor }} />
            Near Your Location
          </h2>
          <p className="ex-section-sub">
            {hotel.city || 'Tashkent'}{hotel.country ? `, ${hotel.country}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="ex-view-map"
          style={{ color: accentColor }}
          onClick={handleExploreMap}
        >
          View on Map <Map size={14} strokeWidth={2.4} />
        </button>
      </div>

      <div className="ex-cards">
        {filtered.length === 0 ? (
          <div className="ex-empty">
            <MapPin size={36} strokeWidth={1.5} />
            <p>No places found</p>
            <small>Try a different category or search query</small>
          </div>
        ) : (
          filtered.map((rec) => {
            const isFav = favorites.has(rec._idx);
            return (
              <div key={rec._idx} className="ex-card">
                <div className="ex-card-photo">
                  {rec.image_url ? (
                    <img src={imageUrl(rec.image_url)} alt={rec.name} />
                  ) : (
                    <div className="ex-card-photo-placeholder">
                      <MapPin size={28} />
                    </div>
                  )}
                  
                  {/* ⭐ YANGI — Distance badge */}
                  {rec.distance !== null && (
                    <div className="ex-card-distance">
                      <MapPin size={10} strokeWidth={2.4} />
                      {formatDistance(rec.distance)}
                    </div>
                  )}
                </div>

                <div className="ex-card-body">
                  <div className="ex-card-head">
                    <div className="ex-card-info">
                      <div className="ex-card-cat" style={{ color: accentColor }}>
                        {CATEGORY_LABELS[rec.category] || rec.category}
                      </div>
                      <h3 className="ex-card-name">{rec.name}</h3>
                    </div>
                    <button
                      type="button"
                      className={`ex-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={() => toggleFavorite(rec._idx)}
                      aria-label="Favorite"
                    >
                      <Heart
                        size={18}
                        strokeWidth={2.2}
                        fill={isFav ? accentColor : 'transparent'}
                        color={isFav ? accentColor : 'currentColor'}
                      />
                    </button>
                  </div>

                  {rec.description && (
                    <p className="ex-card-desc">{rec.description}</p>
                  )}

                  <div className="ex-card-foot">
                    {/* ⭐ YANGI — Open hours */}
                    {rec.open_hours && (
                      <div className="ex-card-meta">
                        <Clock size={12} strokeWidth={2.4} style={{ color: accentColor }} />
                        {rec.open_hours}
                      </div>
                    )}
                    {rec.google_maps_link && (
                      <button
                        type="button"
                        className="ex-card-btn"
                        style={{ background: `${accentColor}15`, color: accentColor }}
                        onClick={() => handleViewDetails(rec.google_maps_link!)}
                      >
                        View Details <ArrowRight size={12} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        className="ex-banner"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
      >
        <div className="ex-banner-icon">
          <MapPin size={20} strokeWidth={2} />
        </div>
        <div className="ex-banner-content">
          <h3 className="ex-banner-title">Discover More</h3>
          <p className="ex-banner-desc">
            Find hidden gems and local favorites recommended just for you.
          </p>
        </div>
        <button
          type="button"
          className="ex-banner-btn"
          style={{ color: accentColor }}
          onClick={handleExploreMap}
        >
          Explore Map <ArrowRight size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

export default ExploreTab;