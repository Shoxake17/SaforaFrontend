// src/pages/guest/modals/CallModall/CallModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, AlertCircle } from 'lucide-react';
import { useGuestCall } from '@hooks/calls/useGuestCall';
import { getCallStatus } from '@services/calls';
import { formatCallDuration, elapsedSecondsFrom } from '@utils/callTimer';
import { STORAGE_KEYS, FAILED_CLEANUP_DELAY_MS } from '@config/callConfig';
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

  const [timerSec, setTimerSec] = useState<number>(0);
  const [originalAnsweredAt, setOriginalAnsweredAt] = useState<number | null>(
    null
  );

  // StrictMode double-mount himoyasi
  const hasStartedRef = useRef<boolean>(false);

  // ═════ Modal mount → call boshlash (1 marta) ═════
  useEffect(() => {
    if (!isOpen) return;
    if (hasStartedRef.current) {
      console.log('[CallModal] startCall already called, skipping');
      return;
    }
    hasStartedRef.current = true;
    startCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ═════ Modal yopilganda — flag reset ═════
  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
    }
  }, [isOpen]);

  // ═════ ESC tugma ═════
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hangUp();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [hangUp, isOpen]);

  // ═════ Body scroll lock ═════
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ═════ Failed bo'lsa avtomatik yopish ═════
  useEffect(() => {
    if (status === 'failed') {
      const t = setTimeout(() => onClose(), FAILED_CLEANUP_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  // ═════ Connected bo'lganda — originalAnsweredAt olish ═════
  useEffect(() => {
    if (status !== 'connected') return;

    let cancelled = false;

    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.GUEST_CALL);
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (!stored.callId) return;

        const data = await getCallStatus(stored.callId);
        if (cancelled) return;

        const startTime = data.originalAnsweredAt || data.answeredAt;
        if (startTime) {
          setOriginalAnsweredAt(new Date(startTime).getTime());
        }
      } catch (err) {
        console.warn('[CallModal] Failed to fetch originalAnsweredAt:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // ═════ Timer ═════
  useEffect(() => {
    if (status !== 'connected' || !originalAnsweredAt) return;

    const updateTimer = () => {
      setTimerSec(elapsedSecondsFrom(originalAnsweredAt));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, originalAnsweredAt]);

  if (!isOpen) return null;

  // ═════ UI helpers ═════
  const getStatusText = (): string => {
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

        {isConnected && originalAnsweredAt && (
          <p className="call-timer">{formatCallDuration(timerSec)}</p>
        )}

        {errorMessage && <p className="call-error">{errorMessage}</p>}
      </div>

      <button
        type="button"
        className="call-end-btn"
        onClick={hangUp}
        aria-label="End call"
      >
        <PhoneOff size={26} color="#fff" strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default CallModal;