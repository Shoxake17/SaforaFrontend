// src/components/RoomGuestsModal/RoomGuestsModal.tsx
import React, { useEffect, useState } from 'react';
import { X, Phone, User, Mail, Wifi, WifiOff, BedDouble, Users } from 'lucide-react';
import { fetchRoomGuests, type RoomGuest } from '@services/roomGuests';
import './RoomGuestsModal.css';

interface Props {
  isOpen: boolean;
  hotelSlug: string;
  roomNumber: string;
  accentColor?: string;
  onClose: () => void;
  onSelectGuest: (guest: RoomGuest) => void;
}

const formatLastSeen = (minutesAgo: number, isOnline: boolean): string => {
  if (isOnline) return 'Online now';
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const RoomGuestsModal: React.FC<Props> = ({
  isOpen,
  hotelSlug,
  roomNumber,
  accentColor = '#f97316',
  onClose,
  onSelectGuest,
}) => {
  const [guests, setGuests] = useState<RoomGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const result = await fetchRoomGuests(hotelSlug, roomNumber);
      if (cancelled) return;

      if (result.success && result.guests) {
        setGuests(result.guests);
      } else {
        setError(result.error || 'Failed to load guests');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, hotelSlug, roomNumber]);

  // ESC tugma
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="rgm-overlay" onClick={onClose}>
      <div className="rgm-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="rgm-header">
          <div className="rgm-header-icon" style={{ background: `${accentColor}20`, color: accentColor }}>
            <BedDouble size={20} strokeWidth={2.2} />
          </div>
          <div className="rgm-header-text">
            <div className="rgm-title">Room {roomNumber}</div>
            <div className="rgm-subtitle">
              {loading
                ? 'Loading guests...'
                : guests.length === 0
                ? 'No guests registered'
                : `Select guest to call (${guests.length})`}
            </div>
          </div>
          <button type="button" className="rgm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        {/* BODY */}
        <div className="rgm-body">
          {loading ? (
            <div className="rgm-empty">
              <div className="rgm-spinner" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="rgm-empty rgm-error">
              <span>{error}</span>
            </div>
          ) : guests.length === 0 ? (
            <div className="rgm-empty">
              <Users size={36} strokeWidth={1.6} />
              <span>No guests registered for this room</span>
              <small>Guests must register via QR code first</small>
            </div>
          ) : (
            guests.map((g) => (
              <div key={g._id} className="rgm-guest-card">
                <div className="rgm-guest-avatar" style={{ background: `${accentColor}15`, color: accentColor }}>
                  <User size={18} strokeWidth={2.2} />
                </div>

                <div className="rgm-guest-info">
                  <div className="rgm-guest-name-row">
                    <span className="rgm-guest-name">{g.fullName}</span>
                    {g.isOnline ? (
                      <span className="rgm-status rgm-status-online">
                        <Wifi size={11} strokeWidth={2.4} /> Online
                      </span>
                    ) : (
                      <span className="rgm-status rgm-status-offline">
                        <WifiOff size={11} strokeWidth={2.4} /> {formatLastSeen(g.minutesAgo, false)}
                      </span>
                    )}
                  </div>

                  {g.email && (
                    <div className="rgm-guest-meta">
                      <Mail size={11} strokeWidth={2.2} />
                      <span>{g.email}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="rgm-call-btn"
                  style={{ background: accentColor }}
                  onClick={() => onSelectGuest(g)}
                  aria-label={`Call ${g.fullName}`}
                >
                  <Phone size={14} strokeWidth={2.4} />
                  <span>Call</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomGuestsModal;