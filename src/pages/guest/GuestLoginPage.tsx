// src/pages/guest/GuestLoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchGuestSession } from '@services/guest';
import {
  getCurrentGuest,
  sendHeartbeat,
  clearLocalSession,
} from '@services/guestAuth';
import { getSocket } from '@services/socket';
import { guestTokenService } from '@services/guestToken';
import { useGuestIncomingPolling } from '@hooks/calls/useGuestIncomingPolling';
import GuestIncomingCallModal from '@components/GuestIncomingCallModal/GuestIncomingCallModal';
import useForceTheme from '@hooks/useForceTheme';
import type { GuestHotel, GuestRoom, GuestSettings } from '@apptypes/guest';
import { useGuestSessionMonitor } from '@hooks/useGuestSessionMonitor';

import GuestMainScreen from './components/GuestMainScreen';

import './GuestLoginPage.css';

const HEARTBEAT_INTERVAL_MS = 15_000;

const GuestLoginPage: React.FC = () => {
  const { slug, roomNumber } = useParams<{
    slug: string;
    roomNumber: string;
  }>();

  const navigate = useNavigate();

  useForceTheme('light');
  useGuestSessionMonitor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hotel, setHotel] = useState<GuestHotel | null>(null);
  const [room, setRoom] = useState<GuestRoom | null>(null);
  const [settings, setSettings] = useState<GuestSettings>({});

  const [guestName, setGuestName] = useState('');
  const [showMain, setShowMain] = useState(false);

  // ═══════════════════════════════════════════════════
  // Socket.IO + Polling fallback
  // ═══════════════════════════════════════════════════
  const { incomingCall, dismissCall, socketConnected } =
    useGuestIncomingPolling(showMain, slug, roomNumber);

  const heartbeatErrorCountRef = useRef<number>(0);

  // ═══════════════════════════════════════════════════
  // Socket holati log
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (showMain) {
      console.log(
        `[GuestLoginPage] Socket: ${socketConnected ? '🟢 CONNECTED' : '🟡 DISCONNECTED (polling)'}`
      );
    }
  }, [socketConnected, showMain]);

  // ═══════════════════════════════════════════════════
  // 1) Hotel + Room ma'lumotlari
  // 2) Token bo'lsa — auto-login
  // 3) Token yo'q yoki muddati o'tgan — /g/register'ga
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!slug || !roomNumber) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
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

        const guest = await getCurrentGuest();

        if (cancelled) return;

        if (guest) {
          console.log('[GuestLoginPage] Auto-login:', guest.fullName);
          setGuestName(guest.fullName);
          setShowMain(true);
        } else {
          // ⭐ Session yo'q yoki muddati o'tgan — register'ga qaytarish
          console.log('[GuestLoginPage] No active session, redirecting to /g/register');
          clearLocalSession();
          navigate('/g/register', { replace: true });
          return;
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
  }, [slug, roomNumber, navigate]);

  // ═══════════════════════════════════════════════════
  // HEARTBEAT — Socket asosiy, REST fallback
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!showMain) return;
    if (!slug || !roomNumber) return;

    let cancelled = false;
    heartbeatErrorCountRef.current = 0;

    const sendHb = async () => {
      if (cancelled) return;

      // 1) Socket orqali (eng tezkor)
      const token = guestTokenService.get();
      if (token) {
        try {
          const socket = getSocket(token);
          if (socket.connected) {
            socket.emit('guest:heartbeat', {
              hotelSlug: slug,
              roomNumber: String(roomNumber),
            });
            heartbeatErrorCountRef.current = 0;
            return;
          }
        } catch {
          // Socket xato — REST fallback
        }
      }

      // 2) REST fallback
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

    sendHb();
    const interval = setInterval(sendHb, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showMain, slug, roomNumber]);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
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
        <p>{error || 'Please try again'}</p>
      </div>
    );
  }

  if (showMain) {
    return (
      <div className="guest-page guest-page-main">

        <GuestMainScreen
          hotel={hotel}
          room={room}
          settings={settings}
          guestName={guestName}
        />

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

  return null;
};

export default GuestLoginPage;