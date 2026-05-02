// src/pages/guest/GuestRoomPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { fetchGuestSession } from '@services/guest';
import useForceTheme from '@hooks/useForceTheme';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';

import GuestHeader from './components/GuestHeader';
import GuestIntroScreen from './components/GuestIntroScreen';
import GuestMainScreen from './components/GuestMainScreen';
import GuestLangSwitcher from './components/GuestLangSwitcher';

import './GuestRoomPage.css';

const STORAGE_NAME_KEY = (slug: string, room: string) => `ghn_${slug}_${room}`;
const STORAGE_PHONE_KEY = (slug: string, room: string) => `gph_${slug}_${room}`;

const GuestRoomPage: React.FC = () => {
  const { slug, roomNumber } = useParams<{ slug: string; roomNumber: string }>();

  // Force light theme for guest page (always)
  useForceTheme('light');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hotel, setHotel] = useState<GuestHotel | null>(null);
  const [room, setRoom] = useState<GuestRoom | null>(null);
  const [settings, setSettings] = useState<GuestSettings>({});

  // Guest session state
  const [guestName, setGuestName] = useState('');
  const [showMain, setShowMain] = useState(false);

  // Load hotel + room info
  useEffect(() => {
    if (!slug || !roomNumber) return;

    const load = async () => {
      setLoading(true);
      const result = await fetchGuestSession(slug, roomNumber);
      setLoading(false);

      if (result.success) {
        setHotel(result.hotel);
        setRoom(result.room);
        setSettings(result.settings || {});

        // Check if guest already registered (saved in localStorage)
        const savedName = localStorage.getItem(STORAGE_NAME_KEY(slug, roomNumber));
        if (savedName) {
          setGuestName(savedName);
          setShowMain(true);
          // Apply intro-mode body class
          document.body.classList.remove('guest-intro-mode');
        } else {
          // Show intro screen
          document.body.classList.add('guest-intro-mode');
        }
      } else {
        setError(result.error || 'Failed to load');
      }
    };

    load();
  }, [slug, roomNumber]);

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('guest-intro-mode');
    };
  }, []);

  const handleRegisterSuccess = (name: string, phone: string, email: string) => {
    if (!slug || !roomNumber) return;

    setGuestName(name);
    localStorage.setItem(STORAGE_NAME_KEY(slug, roomNumber), name);
    if (phone) localStorage.setItem(STORAGE_PHONE_KEY(slug, roomNumber), phone);

    setShowMain(true);
    document.body.classList.remove('guest-intro-mode');
  };

  if (loading) {
    return (
      <div className="guest-loading">
        <Loader2 size={36} className="guest-spin" />
      </div>
    );
  }

  if (error || !hotel || !room) {
    return (
      <div className="guest-error">
        <h2>Hotel or Room not found</h2>
        <p>{error || 'Please check the QR code and try again'}</p>
      </div>
    );
  }

  return (
    <div className="guest-page">
      {/* Animated background orbs */}
      <div className="guest-bg-decor">
        <div className="guest-bg-shape" />
        <div className="guest-bg-shape" />
        <div className="guest-bg-shape" />
      </div>

      {/* Language switcher (top-right corner) */}
      <GuestLangSwitcher />

      <div className="guest-container">
        {/* Header (with weather, room number) */}
        <GuestHeader hotel={hotel} room={room} settings={settings} />

        {/* Body */}
        <div className="guest-body">
          {!showMain ? (
            <GuestIntroScreen
              hotel={hotel}
              room={room}
              settings={settings}
              onRegistered={handleRegisterSuccess}
            />
          ) : (
            <GuestMainScreen
              hotel={hotel}
              room={room}
              settings={settings}
              guestName={guestName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestRoomPage;