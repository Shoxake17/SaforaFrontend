// src/pages/guest/MobileRegisterPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Hotel as HotelIcon,
  DoorOpen,
  Calendar,
  Mail,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Loader2,
  Shield,
} from 'lucide-react';

import { fetchPublicHotels, type PublicHotel } from '@services/hotelsPublic';
import { registerOrLoginGuest } from '@services/guestAuth';

import './MobileRegisterPage.css';

const todayISO = () => new Date().toISOString().split('T')[0];
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const MobileRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [hotels, setHotels] = useState<PublicHotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  const [fullName, setFullName] = useState('');
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(todayISO());
  const [checkOutDate, setCheckOutDate] = useState(addDays(todayISO(), 1));
  const [contact, setContact] = useState('');

  const [showHotelList, setShowHotelList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('@config/api').then(({ API_URL }) => {
  });

    (async () => {
      const list = await fetchPublicHotels();
      setHotels(list);
      setLoadingHotels(false);
    })();
  }, []);

  useEffect(() => {
    if (!showHotelList) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHotelList(false);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHotelList]);

  useEffect(() => {
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setCheckOutDate(addDays(checkInDate, 1));
    }
  }, [checkInDate, checkOutDate]);

  const selectedHotel = hotels.find((h) => h.slug === hotelSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!hotelSlug) {
      setError('Please select a hotel');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Please enter your room number');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setError('Check-out must be after check-in date');
      return;
    }
    if (!contact.trim()) {
      setError('Please enter your phone or email');
      return;
    }

    const isEmail = contact.includes('@');
    const phone = isEmail ? '' : contact.trim();
    const email = isEmail ? contact.trim() : '';

    setSubmitting(true);

    const result = await registerOrLoginGuest({
      fullName: fullName.trim(),
      phone,
      email,
      language: localStorage.getItem('guest_lang') || 'en',
      hotelSlug,
      roomNumber: roomNumber.trim(),
      checkInDate,
      checkOutDate,
    });

    setSubmitting(false);

    if (result.success && result.guest) {
      navigate(`/g/${hotelSlug}/${roomNumber.trim()}`, { replace: true });
    } else {
      setError(result.error || 'Registration failed. Please check your details.');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setError(`${provider === 'google' ? 'Google' : 'Apple'} login coming soon`);
  };

  return (
    <div className="mrp-screen">
      {/* HERO */}
      <div className="mrp-hero">
        <div className="mrp-hero-overlay" />
        <div className="mrp-hero-content">
          <div className="mrp-logo-mark">
            <span>S</span>
          </div>
          <div className="mrp-logo-text">SAFORA</div>
          <div className="mrp-logo-tag">
            DISCOVER <span>UZBEKISTAN</span> DIFFERENTLY
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="mrp-card">
        <h1 className="mrp-title">
          Create Your <span className="mrp-title-accent">Account</span>
        </h1>
        <p className="mrp-subtitle">Fill in your details to get started</p>

        <form className="mrp-form" onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div className="mrp-field">
            <div className="mrp-field-icon">
              <User size={18} strokeWidth={2.2} />
            </div>
            <div className="mrp-field-content">
              <label className="mrp-label">Full Name</label>
              <input
                type="text"
                className="mrp-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                autoComplete="name"
              />
            </div>
          </div>

          {/* HOTEL DROPDOWN */}
          <div className="mrp-field-wrap" ref={dropdownRef}>
            <div className="mrp-field">
              <div className="mrp-field-icon">
                <HotelIcon size={18} strokeWidth={2.2} />
              </div>
              <div className="mrp-field-content">
                <label className="mrp-label">Choose Hotel</label>
                <button
                  type="button"
                  className="mrp-dropdown-trigger"
                  onClick={() => setShowHotelList((v) => !v)}
                  disabled={loadingHotels}
                >
                  <span className={selectedHotel ? '' : 'mrp-placeholder'}>
                    {loadingHotels
                      ? 'Loading hotels...'
                      : selectedHotel
                      ? selectedHotel.name
                      : 'Select your hotel'}
                  </span>
                </button>
              </div>
              <ChevronDown
                size={18}
                className={`mrp-chevron ${showHotelList ? 'open' : ''}`}
              />
            </div>

            {showHotelList && hotels.length > 0 && (
              <div className="mrp-dropdown-list">
                {hotels.map((h) => (
                  <button
                    key={h._id}
                    type="button"
                    className={`mrp-dropdown-item ${
                      h.slug === hotelSlug ? 'active' : ''
                    }`}
                    onClick={() => {
                      setHotelSlug(h.slug);
                      setShowHotelList(false);
                    }}
                  >
                    <div className="mrp-dropdown-name">{h.name}</div>
                    {h.city && (
                      <div className="mrp-dropdown-meta">
                        {h.city}
                        {h.country ? `, ${h.country}` : ''}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showHotelList && !loadingHotels && hotels.length === 0 && (
              <div className="mrp-dropdown-list">
                <div className="mrp-dropdown-empty">No hotels available</div>
              </div>
            )}
          </div>

          {/* ROOM NUMBER */}
          <div className="mrp-field">
            <div className="mrp-field-icon">
              <DoorOpen size={18} strokeWidth={2.2} />
            </div>
            <div className="mrp-field-content">
              <label className="mrp-label">Room Number</label>
              <input
                type="text"
                inputMode="numeric"
                className="mrp-input"
                placeholder="Enter your room number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                maxLength={20}
              />
            </div>
          </div>

          {/* DATES */}
          <div className="mrp-dates">
            <div className="mrp-field mrp-date-field">
              <div className="mrp-field-icon mrp-icon-sm">
                <Calendar size={16} strokeWidth={2.2} />
              </div>
              <div className="mrp-field-content">
                <label className="mrp-label">Check-in</label>
                <input
                  type="date"
                  className="mrp-input mrp-date-input"
                  value={checkInDate}
                  min={todayISO()}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mrp-field mrp-date-field">
              <div className="mrp-field-icon mrp-icon-sm">
                <Calendar size={16} strokeWidth={2.2} />
              </div>
              <div className="mrp-field-content">
                <label className="mrp-label">Check-out</label>
                <input
                  type="date"
                  className="mrp-input mrp-date-input"
                  value={checkOutDate}
                  min={addDays(checkInDate, 1)}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="mrp-field">
            <div className="mrp-field-icon">
              <Mail size={18} strokeWidth={2.2} />
            </div>
            <div className="mrp-field-content">
              <label className="mrp-label">Phone Number or Email</label>
              <input
                type="text"
                className="mrp-input"
                placeholder="Enter your phone number or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={120}
                autoComplete="email"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mrp-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="mrp-submit"
            disabled={submitting || loadingHotels}
          >
            {submitting ? (
              <Loader2 size={18} className="mrp-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} strokeWidth={2.4} />
              </>
            )}
          </button>

          

          
        </form>
      </div>
    </div>
  );
};

export default MobileRegisterPage;