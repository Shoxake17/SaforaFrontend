// src/pages/guest/modals/MapPickerModal/MapPickerModal.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X, Check, Search, Loader2, MapPin, Crosshair,
} from 'lucide-react';
import { formatNominatimAddress, formatSearchResult } from '@utils/formatAddress';
import './MapPickerModal.css';

interface Coords {
  lat: number;
  lng: number;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: { address: string; coords: Coords }) => void;
  initialCenter?: Coords;
  title?: string;
  accentColor?: string;
}

const DEFAULT_CENTER: Coords = { lat: 41.3111, lng: 69.2797 };

// MAPTILER CONFIG
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const MAPTILER_STYLE = 'streets-v2';

const getTileUrl = (): string => {
  if (MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/${MAPTILER_STYLE}/{z}/{x}/{y}@2x.png?key=${MAPTILER_KEY}`;
  }
  console.warn('[MapPickerModal] VITE_MAPTILER_KEY topilmadi — OSM fallback');
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

const getTileAttribution = (): string => {
  return MAPTILER_KEY
    ? '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    : '© OSM contributors';
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen, onClose, onSelect, initialCenter,
  title = 'Manzilni tanlang',
  accentColor = '#f97316',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // ⭐ Reverse geocode + format
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=uz,ru,en&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      // ⭐ Toza manzil
      const cleanAddress = formatNominatimAddress(data);
      setAddress(cleanAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (!isOpen) return;

    const initTimer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const center = initialCenter || DEFAULT_CENTER;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([center.lat, center.lng], 16);

      L.tileLayer(getTileUrl(), {
        maxZoom: 19,
        tileSize: MAPTILER_KEY ? 512 : 256,
        zoomOffset: MAPTILER_KEY ? -1 : 0,
        attribution: getTileAttribution(),
        crossOrigin: true,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapRef.current = map;
      setCoords(center);
      reverseGeocode(center.lat, center.lng);

      map.on('moveend', () => {
        const c = map.getCenter();
        setCoords({ lat: c.lat, lng: c.lng });
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
          reverseGeocode(c.lat, c.lng);
        }, 500);
      });

      setTimeout(() => map.invalidateSize(), 100);
    }, 100);

    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(initTimer);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Search
  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=uz,ru,en&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    if (!mapRef.current) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    mapRef.current.setView([lat, lng], 17);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17);
      },
      (err) => console.warn('Geolocation:', err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    if (coords && address) {
      onSelect({ address, coords });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mpm-overlay">
      <div className="mpm-modal">
        <div className="mpm-topbar">
          <button type="button" className="mpm-back" onClick={onClose} aria-label="Back">
            <X size={20} strokeWidth={2.4} />
          </button>
          <h2 className="mpm-title">{title}</h2>
        </div>

        <div className="mpm-search-wrap">
          <div className="mpm-search-input-wrap" onClick={() => setSearchOpen(true)}>
            <Search size={16} strokeWidth={2.2} className="mpm-search-icon" />
            <input
              type="text"
              className="mpm-search-input"
              placeholder="Manzil yoki joy nomini qidirish..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
          </div>

          {searchOpen && searchResults.length > 0 && (
            <div className="mpm-search-results">
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="mpm-search-result"
                  onClick={() => handleSelectSearchResult(r)}
                >
                  <MapPin size={14} strokeWidth={2.2} className="mpm-search-result-icon" />
                  <span className="mpm-search-result-text">
                    {formatSearchResult(r)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mpm-map-wrap">
          <div ref={containerRef} className="mpm-map" />

          <div className="mpm-center-pin">
            <div className="mpm-pin-shadow" style={{ background: accentColor }} />
            <div className="mpm-pin-marker" style={{ background: accentColor }}>
              <MapPin size={22} strokeWidth={2.4} fill="white" color="white" />
            </div>
          </div>

          <button
            type="button"
            className="mpm-my-location"
            onClick={handleUseMyLocation}
            aria-label="Mening joylashuvim"
          >
            <Crosshair size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mpm-bottom">
          <div className="mpm-address-box">
            <MapPin size={16} strokeWidth={2.4} style={{ color: accentColor, flexShrink: 0 }} />
            <div className="mpm-address-text">
              {loading ? (
                <span className="mpm-address-loading">
                  <Loader2 size={12} className="mpm-spin" /> Manzil aniqlanmoqda...
                </span>
              ) : (
                address || 'Joyni tanlang'
              )}
            </div>
          </div>

          <button
            type="button"
            className="mpm-confirm-btn"
            onClick={handleConfirm}
            disabled={!address || loading}
            style={{ background: accentColor }}
          >
            <Check size={18} strokeWidth={2.4} /> Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;