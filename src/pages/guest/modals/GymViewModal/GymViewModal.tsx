// src/pages/guest/modals/GymViewModal/GymViewModal.tsx
import React, { useEffect } from 'react';
import { X, Clock, MapPin, Dumbbell, FileText } from 'lucide-react';
import { imageUrl } from '@utils/imageUrl';
import './GymViewModal.css';

export interface GymDetails {
  image_url?: string;
  description?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
  location?: string;
}

interface GymViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: GymDetails;
  accentColor: string;
}

const GymViewModal: React.FC<GymViewModalProps> = ({
  isOpen,
  onClose,
  gym,
  accentColor,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasImage = gym.image_url && gym.image_url.trim().length > 0;
  const hasLocation = gym.location && gym.location.trim().length > 0;
  const hasDescription = gym.description && gym.description.trim().length > 0;

  // Hours text
  const hoursText = gym.is_24_hours
    ? 'Open 24 Hours'
    : `${gym.open_time || '06:00'} - ${gym.close_time || '23:00'}`;

  const hasAnyContent = hasImage || hasLocation || hasDescription;

  return (
    <div className="gv-overlay" onClick={onClose}>
      <div className="gv-modal" onClick={(e) => e.stopPropagation()}>
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="gv-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.4} />
        </button>

        {/* HERO IMAGE */}
        {hasImage ? (
          <div className="gv-hero">
            <img src={imageUrl(gym.image_url!)} alt="Gym" />
            <div className="gv-hero-overlay" />
            
          </div>
        ) : (
          <div
            className="gv-hero gv-hero-placeholder"
            style={{ background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}10)` }}
          >
            <div className="gv-hero-icon-center" style={{ background: accentColor }}>
              <Dumbbell size={32} strokeWidth={2} />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="gv-content">
          <h2 className="gv-title">Gym & Fitness</h2>

          {!hasAnyContent && (
            <p className="gv-empty">
              No information added yet. Hotel manager will add details soon.
            </p>
          )}

          {/* HOURS */}
          <div className="gv-info-card">
            <div
              className="gv-info-icon"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              <Clock size={16} strokeWidth={2.2} />
            </div>
            <div className="gv-info-text">
              <div className="gv-info-label">Opening Hours</div>
              <div className="gv-info-value">{hoursText}</div>
            </div>
          </div>

          {/* LOCATION */}
          {hasLocation && (
            <div className="gv-info-card">
              <div
                className="gv-info-icon"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                <MapPin size={16} strokeWidth={2.2} />
              </div>
              <div className="gv-info-text">
                <div className="gv-info-label">Location</div>
                <div className="gv-info-value">{gym.location}</div>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {hasDescription && (
            <div className="gv-section">
              <div className="gv-section-title">
                <FileText size={14} strokeWidth={2.2} style={{ color: accentColor }} />
                About
              </div>
              <p className="gv-description">{gym.description}</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="gv-footer">
          <button
            type="button"
            className="gv-btn-close"
            onClick={onClose}
            style={{ background: accentColor }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default GymViewModal;