// src/pages/guest/components/GuestIntroScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  BellRing,
  ConciergeBell,
  WandSparkles,
  Phone,
  Star,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

import { registerOrLoginGuest } from '@services/guestAuth';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

interface Props {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
  onRegistered: (name: string, phone: string, email: string) => void;
}

const GuestIntroScreen: React.FC<Props> = ({ hotel, room, settings, onRegistered }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const hasRules = !!settings.hotel_rules;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      nameRef.current?.focus();
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter your phone number');
      return;
    }

    setSubmitting(true);
    setError(null);

    // ✅ YANGI API — MongoDB'ga saqlaydi va JWT token qaytaradi
    const result = await registerOrLoginGuest({
      fullName: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      language: localStorage.getItem('guest_lang') || 'en',
      hotelSlug: hotel.slug,
      roomNumber: room.number,
    });

    setSubmitting(false);

    if (result.success && result.guest) {
      // Token avtomatik saqlangan (registerOrLoginGuest ichida)
      // MongoDB'dagi guest ma'lumotlarini parent'ga uzatamiz
      onRegistered(
        result.guest.fullName,
        result.guest.phone,
        result.guest.email
      );
    } else {
      // Endi xatoni ko'rsatamiz (silent fail YO'Q)
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      {hasRules && (
        <div className="guest-rules-banner">
          <div className="guest-rules-header">
            <div className="guest-rules-badge">
              <AlertCircle size={14} strokeWidth={2.2} />
            </div>
            <div className="guest-rules-title">Hotel Rules</div>
          </div>
          <div
            className="guest-rules-list"
            dangerouslySetInnerHTML={{
              __html: (settings.hotel_rules || '').replace(/\n/g, '<br/>'),
            }}
          />
        </div>
      )}

      <div className="guest-intro-screen">
        <form className="guest-intro-card" onSubmit={handleSubmit}>
          <div className="guest-intro-icon">
            <BellRing size={26} strokeWidth={2.2} />
          </div>

          <h2 className="guest-intro-title">
            {settings.welcome_title || `Welcome to ${hotel.name}`}
          </h2>
          <p className="guest-intro-sub">
            {settings.welcome_subtitle || 'We are here to make your stay exceptional.'}
          </p>

          <div className="guest-intro-features">
            <div className="guest-intro-feat">
              <ConciergeBell size={18} color="#16a34a" />
              <span>Services</span>
            </div>
            <div className="guest-intro-feat">
              <WandSparkles size={18} color="#7c3aed" />
              <span>AI Guide</span>
            </div>
            <div className="guest-intro-feat">
              <Phone size={18} color="#22c55e" />
              <span>Support</span>
            </div>
            <div className="guest-intro-feat">
              <Star size={18} color="#f59e0b" />
              <span>Reviews</span>
            </div>
          </div>

          {error && (
            <div className="guest-intro-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <input
            ref={nameRef}
            type="text"
            className="guest-input"
            placeholder="Enter your name to get started"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="given-name"
          />

          <input
            type="tel"
            className="guest-input"
            placeholder="+998 XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            autoComplete="tel"
          />

          <input
            type="email"
            className="guest-input"
            placeholder="your@email.com (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            autoComplete="email"
          />

          <button
            type="submit"
            className="guest-btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <span>Loading...</span>
            ) : (
              <>
                <ArrowRight size={16} strokeWidth={2.4} />
                Continue
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default GuestIntroScreen;