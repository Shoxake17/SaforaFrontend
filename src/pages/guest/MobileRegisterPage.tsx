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
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

import { fetchPublicHotels, type PublicHotel } from '@services/hotelsPublic';
import { registerOrLoginGuest } from '@services/guestAuth';
import { sendOtp, verifyOtp } from '@services/otpService';

import './MobileRegisterPage.css';

const todayISO = () => new Date().toISOString().split('T')[0];
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

type Step = 'form' | 'otp';

const MobileRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [hotels, setHotels] = useState<PublicHotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Form state
  const [fullName, setFullName] = useState('');
  const [hotelSlug, setHotelSlug] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState(todayISO());
  const [checkOutDate, setCheckOutDate] = useState(addDays(todayISO(), 1));
  const [contact, setContact] = useState('');

  // Step management
  const [step, setStep] = useState<Step>('form');
  const [showHotelList, setShowHotelList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // ─── Load hotels ─────────────────────────────────
  useEffect(() => {
    (async () => {
      const list = await fetchPublicHotels();
      setHotels(list);
      setLoadingHotels(false);
    })();
  }, []);

  // ─── Close dropdown on outside click ──────────────
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

  // ─── Auto-fix checkout date ──────────────────────
  useEffect(() => {
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setCheckOutDate(addDays(checkInDate, 1));
    }
  }, [checkInDate, checkOutDate]);

  // ─── Resend timer countdown ──────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ─── Focus first OTP input on step change ────────
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const selectedHotel = hotels.find((h) => h.slug === hotelSlug);
  const isEmail = contact.includes('@');

  // ─── STEP 1: Form submit → Send OTP ──────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Iltimos to\'liq ismingizni kiriting');
      return;
    }
    if (!hotelSlug) {
      setError('Iltimos mehmonxonani tanlang');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Iltimos xona raqamini kiriting');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError('Iltimos kelish va ketish sanalarini tanlang');
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setError('Ketish sanasi kelish sanasidan keyin bo\'lishi kerak');
      return;
    }
    if (!contact.trim()) {
      setError('Iltimos email kiriting');
      return;
    }
    if (!contact.includes('@')) {
      setError('Iltimos to\'g\'ri email kiriting (hozircha faqat email)');
      return;
    }

    // Email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(contact.trim())) {
      setError('Email formati noto\'g\'ri');
      return;
    }

    // Send OTP
    setSubmitting(true);
    const result = await sendOtp(contact.trim());
    setSubmitting(false);

    if (result.success) {
      setStep('otp');
      setResendTimer(60);
      setOtpCode(['', '', '', '', '', '']);
    } else {
      if (result.retryAfter) {
        setError(`Iltimos ${result.retryAfter} soniya kuting`);
        setResendTimer(result.retryAfter);
      } else {
        setError(result.error || 'OTP yuborishda xato');
      }
    }
  };

  // ─── OTP digit input ─────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpCode];
    next[index] = value;
    setOtpCode(next);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpCode(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ─── STEP 2: Verify OTP → Register ───────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Iltimos 6 raqamli kodni to\'liq kiriting');
      return;
    }

    setSubmitting(true);

    // 1. Verify OTP
    const verifyResult = await verifyOtp(contact.trim(), code);

    if (!verifyResult.success) {
      setSubmitting(false);
      setError(verifyResult.error || 'Kod noto\'g\'ri');
      // Clear OTP fields on error
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      return;
    }

    // 2. Register guest after successful OTP
    const result = await registerOrLoginGuest({
      fullName: fullName.trim(),
      phone: '',
      email: contact.trim(),
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
      setError(result.error || 'Ro\'yxatdan o\'tishda xato');
    }
  };

  // ─── Resend OTP ──────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setSubmitting(true);
    const result = await sendOtp(contact.trim());
    setSubmitting(false);
    if (result.success) {
      setResendTimer(60);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } else {
      setError(result.error || 'OTP qayta yuborishda xato');
    }
  };

  // ─── Back to form ────────────────────────────────
  const handleBack = () => {
    setStep('form');
    setError(null);
    setOtpCode(['', '', '', '', '', '']);
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
        {step === 'form' ? (
          <>
            <h1 className="mrp-title">
              Create Your <span className="mrp-title-accent">Account</span>
            </h1>
            <p className="mrp-subtitle">Fill in your details to get started</p>

            <form className="mrp-form" onSubmit={handleFormSubmit}>
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

              {/* CONTACT (Email) */}
              <div className="mrp-field">
                <div className="mrp-field-icon">
                  <Mail size={18} strokeWidth={2.2} />
                </div>
                <div className="mrp-field-content">
                  <label className="mrp-label">Email Address</label>
                  <input
                    type="email"
                    className="mrp-input"
                    placeholder="Enter your email"
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
                    <span>Get Verification Code</span>
                    <ArrowRight size={18} strokeWidth={2.4} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          // ═══════════════════════════════════════════
          // STEP 2: OTP VERIFICATION
          // ═══════════════════════════════════════════
          <>
            <button type="button" className="mrp-back-btn" onClick={handleBack}>
              <ArrowLeft size={16} strokeWidth={2.4} />
              <span>Back</span>
            </button>

            <div className="mrp-otp-icon">
              <Shield size={32} strokeWidth={2} />
            </div>

            <h1 className="mrp-title">
              Verify Your <span className="mrp-title-accent">Email</span>
            </h1>
            <p className="mrp-subtitle">
              We sent a 6-digit code to<br />
              <strong>{contact}</strong>
            </p>

            <form className="mrp-form" onSubmit={handleOtpSubmit}>
              {/* OTP INPUTS */}
              <div className="mrp-otp-grid">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`mrp-otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                  />
                ))}
              </div>

              {/* ERROR */}
              {error && (
                <div className="mrp-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* RESEND */}
              <div className="mrp-resend">
                {resendTimer > 0 ? (
                  <span className="mrp-resend-timer">
                    Resend code in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="mrp-resend-btn"
                    onClick={handleResend}
                    disabled={submitting}
                  >
                    <RefreshCw size={14} strokeWidth={2.4} />
                    <span>Resend code</span>
                  </button>
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="mrp-submit"
                disabled={submitting || otpCode.join('').length !== 6}
              >
                {submitting ? (
                  <Loader2 size={18} className="mrp-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileRegisterPage;