// src/pages/guest/modals/CallModal.tsx
import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, AlertCircle } from 'lucide-react';
import { useGuestCall } from '../hooks/useGuestCall';
import { getCallStatus } from '@services/calls';
import './CallModal.css';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  hotelSlug: string;
  phone?: string;
  whatsapp?: string;
  accentColor?: string;
  guestName?: string;
  roomNumber?: string;
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  hotelSlug,
  guestName = 'Guest',
  roomNumber = '',
}) => {
  const { status, errorMessage, startCall, hangUp } = useGuestCall({
    hotelSlug,
    roomNumber,
    guestName,
    onEnded: onClose,
  });

  // ✅ Timer state — originalAnsweredAt'dan hisoblanadi
  const [timerSec, setTimerSec] = useState(0);
  const [originalAnsweredAt, setOriginalAnsweredAt] = useState<number | null>(null);

  useEffect(() => {
    startCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleEndCall();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (status === 'failed') {
      const t = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  // ═══════════════════════════════════════════════════
  // ✅ Connected bo'lganda — backend'dan originalAnsweredAt olish
  // (Refresh'dan keyin timer haqiqiy boshlanish vaqtidan davom etadi)
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (status !== 'connected') return;

    const STORAGE_KEY = 'safora_active_call';
    let cancelled = false;

    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (!stored.callId) return;

        const data = await getCallStatus(stored.callId);
        if (cancelled) return;

        if (data.originalAnsweredAt) {
          setOriginalAnsweredAt(new Date(data.originalAnsweredAt).getTime());
        } else if (data.answeredAt) {
          setOriginalAnsweredAt(new Date(data.answeredAt).getTime());
        }
      } catch (err) {
        console.warn('[CallModal] Failed to fetch originalAnsweredAt:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // ✅ Timer — originalAnsweredAt'dan hisoblash
  useEffect(() => {
    if (status !== 'connected' || !originalAnsweredAt) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - originalAnsweredAt) / 1000);
      setTimerSec(Math.max(0, elapsed));
    };

    updateTimer(); // Darhol birinchi update
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, originalAnsweredAt]);

  const handleEndCall = () => {
    hangUp();
  };

  if (!isOpen) return null;

  const getStatusText = () => {
    switch (status) {
      case 'requesting-mic':
        return 'Requesting microphone…';
      case 'connecting':
        return 'Connecting…';
      case 'ringing':
        return 'Calling Reception…';
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting…';
      case 'ended':
        return 'Call ended';
      case 'failed':
        return 'Call failed';
      default:
        return 'Calling Reception…';
    }
  };

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const isConnected = status === 'connected';
  const isFailed = status === 'failed';

  return (
    <div className="call-overlay">
      <div className="call-icon-wrap">
        {!isFailed && (
          <>
            <div
              className={`call-pulse-ring call-pulse-1 ${
                isConnected ? 'call-pulse-green' : ''
              }`}
            />
            <div
              className={`call-pulse-ring call-pulse-2 ${
                isConnected ? 'call-pulse-green' : ''
              }`}
            />
            <div
              className={`call-pulse-ring call-pulse-3 ${
                isConnected ? 'call-pulse-green' : ''
              }`}
            />
          </>
        )}
        <div
          className={`call-icon-circle ${
            isConnected ? 'call-icon-circle-green' : ''
          } ${isFailed ? 'call-icon-circle-failed' : ''}`}
        >
          {isFailed ? (
            <AlertCircle size={32} color="#fbbf24" strokeWidth={2.4} />
          ) : (
            <Phone
              size={32}
              color={isConnected ? '#22c55e' : '#ef4444'}
              strokeWidth={2.4}
            />
          )}
        </div>
      </div>

      <div className="call-info">
        <h2 className="call-status-text">{getStatusText()}</h2>
        <p className="call-meta">
          {roomNumber && `Room ${roomNumber}`}
          {roomNumber && guestName && ' — '}
          {guestName}
        </p>

        {/* ✅ Timer faqat connected + originalAnsweredAt bor bo'lganda */}
        {isConnected && originalAnsweredAt && (
          <p className="call-timer">{formatTimer(timerSec)}</p>
        )}

        {errorMessage && <p className="call-error">{errorMessage}</p>}
      </div>

      <button
        type="button"
        className="call-end-btn"
        onClick={handleEndCall}
        aria-label="End call"
      >
        <PhoneOff size={26} color="#fff" strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default CallModal;