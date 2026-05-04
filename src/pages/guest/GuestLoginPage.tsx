// src/pages/guest/GuestLoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchGuestSession } from '@services/guest';
import { getCurrentGuest, sendHeartbeat } from '@services/guestAuth';
import { useGuestIncomingPolling } from '@hooks/calls/useGuestIncomingPolling';
import GuestIncomingCallModal from '@components/GuestIncomingCallModal/GuestIncomingCallModal';
import useForceTheme from '@hooks/useForceTheme';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

import GuestHeader from './components/GuestHeader';
import GuestIntroScreen from './components/GuestIntroScreen';
import GuestMainScreen from './components/GuestMainScreen';
import GuestLangSwitcher from './components/GuestLangSwitcher';

import './GuestLoginPage.css';

// Heartbeat interval — har 10 sekundda backend'ga "men online" signal
const HEARTBEAT_INTERVAL_MS = 10_000;

const GuestLoginPage: React.FC = () => {
  const { slug, roomNumber } = useParams<{ slug: string; roomNumber: string }>();

  useForceTheme('light');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hotel, setHotel] = useState<GuestHotel | null>(null);
  const [room, setRoom] = useState<GuestRoom | null>(null);
  const [settings, setSettings] = useState<GuestSettings>({});

  // Guest session — MongoDB'dan keladi
  const [guestName, setGuestName] = useState('');
  const [showMain, setShowMain] = useState(false);

  // ═══════════════════════════════════════════════════
  // Manager dan kelayotgan call'larni polling qilish
  // (faqat showMain=true bo'lganda yoqiladi)
  // ═══════════════════════════════════════════════════
  const { incomingCall, dismissCall } = useGuestIncomingPolling(showMain, roomNumber);

  // Heartbeat kuzatuvchi — qayta yuklash uchun
  const heartbeatErrorCountRef = useRef<number>(0);

  // ═══════════════════════════════════════════════════
  // 1) Hotel + Room ma'lumotlarini yuklash
  // 2) Token bo'lsa — guest ma'lumotlarini /me dan olish
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!slug || !roomNumber) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Hotel + Room
        const sessionResult = await fetchGuestSession(slug, roomNumber);

        if (cancelled) return;

        if (!sessionResult.success) {
          setError(sessionResult.error || 'Failed to load hotel data');
          setLoading(false);
          return;
        }

        setHotel(sessionResult.hotel);
        setRoom(sessionResult.room);
        setSettings(sessionResult.settings || {});

        // 2) Token bormi tekshirish va guest ma'lumotlarini olish
        const guest = await getCurrentGuest();

        if (cancelled) return;

        if (guest) {
          // Token bor va yaroqli — avtomatik kirish
          console.log('[GuestLoginPage] Auto-login from token:', guest.fullName);
          setGuestName(guest.fullName);
          setShowMain(true);
          document.body.classList.remove('guest-intro-mode');
        } else {
          // Token yo'q yoki yaroqsiz — Intro screen
          document.body.classList.add('guest-intro-mode');
        }
      } catch (err) {
        console.error('[GuestLoginPage] Load error:', err);
        if (!cancelled) {
          setError('Failed to load. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, roomNumber]);

  // ═══════════════════════════════════════════════════
  // ⭐ HEARTBEAT — Manager → Guest call uchun online tracking
  // Har 10 sekundda backend'ga "men hali shu xonadaman" signal yuborish
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!showMain) return;
    if (!slug || !roomNumber) return;

    let cancelled = false;
    heartbeatErrorCountRef.current = 0;

    const sendHb = async () => {
      if (cancelled) return;

      try {
        const ok = await sendHeartbeat({
          hotelSlug: slug,
          roomNumber: String(roomNumber),
        });

        if (ok) {
          heartbeatErrorCountRef.current = 0;
        } else {
          heartbeatErrorCountRef.current += 1;
          if (heartbeatErrorCountRef.current >= 3) {
            console.warn('[GuestLoginPage] Heartbeat failing repeatedly');
          }
        }
      } catch (err) {
        heartbeatErrorCountRef.current += 1;
        console.warn('[GuestLoginPage] Heartbeat error:', err);
      }
    };

    // Darhol bir marta yuborish (kutmasdan)
    sendHb();

    // Keyin har 10 sek
    const interval = setInterval(sendHb, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showMain, slug, roomNumber]);

  // ═══════════════════════════════════════════════════
  // Cleanup body class on unmount
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      document.body.classList.remove('guest-intro-mode');
    };
  }, []);

  // ═══════════════════════════════════════════════════
  // Register dan keyin (token allaqachon saqlangan)
  // ═══════════════════════════════════════════════════
  const handleRegisterSuccess = (
    name: string,
    _phone: string,
    _email: string
  ) => {
    setGuestName(name);
    setShowMain(true);
    document.body.classList.remove('guest-intro-mode');
  };

  // ═══════════════════════════════════════════════════
  // RENDER: Loading
  // ═══════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="guest-loading">
        <Loader2 size={36} className="guest-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Error
  // ═══════════════════════════════════════════════════
  if (error || !hotel || !room) {
    return (
      <div className="guest-error">
        <h2>Hotel or Room not found</h2>
        <p>{error || 'Please check the QR code and try again'}</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: MAIN SCREEN (login dan keyin)
  // ═══════════════════════════════════════════════════
  if (showMain) {
    return (
      <div className="guest-page guest-page-main">
        <GuestLangSwitcher />
        <GuestMainScreen
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
        />

        {/* Manager dan kelayotgan incoming call modali */}
        {incomingCall && (
          <GuestIncomingCallModal
            callId={incomingCall.callId}
            offerSdp={incomingCall.offerSdp}
            callerName={incomingCall.initiatedByName}
            guestName={guestName}
            roomNumber={incomingCall.roomNumber}
            onClose={dismissCall}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: LOGIN SCREEN (intro)
  // ═══════════════════════════════════════════════════
  return (
    <div className="guest-page">
      <div className="guest-bg-decor">
        <div className="guest-bg-shape" />
        <div className="guest-bg-shape" />
        <div className="guest-bg-shape" />
      </div>

      <GuestLangSwitcher />

      <div className="guest-container">
        <GuestHeader hotel={hotel} room={room} settings={settings} />

        <div className="guest-body">
          <GuestIntroScreen
            hotel={hotel}
            room={room}
            settings={settings}
            onRegistered={handleRegisterSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default GuestLoginPage;