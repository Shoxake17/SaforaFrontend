// src/components/OutgoingCallModal.tsx
import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, AlertCircle } from 'lucide-react';
import { useStaffOutgoingCall } from '@hooks/calls/useStaffOutgoingCall';
import { getCallStatus } from '@services/calls';
import { formatCallDuration, elapsedSecondsFrom } from '@utils/callTimer';
import './OutgoingCallModal.css';

interface Props {
  isOpen: boolean;
  roomNumber: string;
  onClose: () => void;
}

const OutgoingCallModal: React.FC<Props> = ({ isOpen, roomNumber, onClose }) => {
  const { status, errorMessage, guestInfo, startCall, hangUp } =
    useStaffOutgoingCall({ onEnded: onClose });

  const [timerSec, setTimerSec] = useState<number>(0);
  const [originalAnsweredAt, setOriginalAnsweredAt] = useState<number | null>(
    null
  );

  // Modal mount → call boshlash (1 marta)
  useEffect(() => {
    if (!isOpen) return;
    startCall(roomNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomNumber]);

  // ESC tugma
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hangUp();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, hangUp]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Connected → originalAnsweredAt olish
  useEffect(() => {
    if (status !== 'connected') return;

    let cancelled = false;
    (async () => {
      try {
        const callIdMatch = (window as any).__lastCallId;
        if (!callIdMatch) return;
        const data = await getCallStatus(callIdMatch);
        if (cancelled) return;
        const startTime = data.originalAnsweredAt || data.answeredAt;
        if (startTime) {
          setOriginalAnsweredAt(new Date(startTime).getTime());
        } else {
          setOriginalAnsweredAt(Date.now());
        }
      } catch {
        setOriginalAnsweredAt(Date.now());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // Fallback timer — agar originalAnsweredAt bo'lmasa
  useEffect(() => {
    if (status !== 'connected') return;
    if (!originalAnsweredAt) {
      setOriginalAnsweredAt(Date.now());
      return;
    }

    const updateTimer = () => {
      setTimerSec(elapsedSecondsFrom(originalAnsweredAt));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, originalAnsweredAt]);

  if (!isOpen) return null;

  const getStatusText = (): string => {
    switch (status) {
      case 'requesting-mic':
        return 'Requesting microphone…';
      case 'connecting':
        return 'Connecting…';
      case 'ringing':
        return `Calling Room ${roomNumber}…`;
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call ended';
      case 'failed':
        return 'Call failed';
      default:
        return 'Calling…';
    }
  };

  const isConnected = status === 'connected';
  const isFailed = status === 'failed';

  return (
    <div className="ocm-overlay">
      <div className="ocm-icon-wrap">
        {!isFailed && (
          <>
            <div
              className={`ocm-pulse-ring ocm-pulse-1 ${
                isConnected ? 'ocm-pulse-green' : ''
              }`}
            />
            <div
              className={`ocm-pulse-ring ocm-pulse-2 ${
                isConnected ? 'ocm-pulse-green' : ''
              }`}
            />
            <div
              className={`ocm-pulse-ring ocm-pulse-3 ${
                isConnected ? 'ocm-pulse-green' : ''
              }`}
            />
          </>
        )}
        <div
          className={`ocm-icon-circle ${
            isConnected ? 'ocm-icon-circle-green' : ''
          } ${isFailed ? 'ocm-icon-circle-failed' : ''}`}
        >
          {isFailed ? (
            <AlertCircle size={32} color="#fbbf24" strokeWidth={2.4} />
          ) : (
            <Phone
              size={32}
              color={isConnected ? '#22c55e' : '#3b82f6'}
              strokeWidth={2.4}
            />
          )}
        </div>
      </div>

      <div className="ocm-info">
        <h2 className="ocm-status-text">{getStatusText()}</h2>
        <p className="ocm-meta">
          Room {roomNumber}
          {guestInfo?.name && ` — ${guestInfo.name}`}
        </p>

        {isConnected && originalAnsweredAt && (
          <p className="ocm-timer">{formatCallDuration(timerSec)}</p>
        )}

        {errorMessage && <p className="ocm-error">{errorMessage}</p>}
      </div>

      <button
        type="button"
        className="ocm-end-btn"
        onClick={hangUp}
        aria-label="End call"
      >
        <PhoneOff size={26} color="#fff" strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default OutgoingCallModal;