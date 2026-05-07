// src/pages/guest/modals/ServiceViewModal/ServiceViewModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Clock, MapPin, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { imageUrl } from '@utils/imageUrl';
import './ServiceViewModal.css';

export interface ServiceDetail {
  images?: string[];
  description?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
  location?: string;
}

interface ServiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  serviceColor: string;
  serviceIcon: LucideIcon;
  detail: ServiceDetail;
  accentColor: string;
}

const ServiceViewModal: React.FC<ServiceViewModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
  serviceColor,
  serviceIcon: Icon,
  detail,
  accentColor,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveIdx(0);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const images = Array.isArray(detail.images) ? detail.images : [];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const hasLocation = detail.location && detail.location.trim().length > 0;
  const hasDescription = detail.description && detail.description.trim().length > 0;

  const hoursText = detail.is_24_hours
    ? 'Open 24 Hours'
    : `${detail.open_time || '06:00'} - ${detail.close_time || '23:00'}`;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const itemWidth = scrollRef.current.clientWidth;
    const newIdx = Math.round(scrollLeft / itemWidth);
    if (newIdx !== activeIdx) setActiveIdx(newIdx);
  };

  const handleDotClick = (idx: number) => {
    if (!scrollRef.current) return;
    const itemWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: idx * itemWidth,
      behavior: 'smooth',
    });
  };

  return (
    <div className="svm-overlay" onClick={onClose}>
      <div className="svm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="svm-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.4} />
        </button>

        {/* HERO — Multiple images horizontal scroll */}
        {hasImages ? (
          <div className="svm-hero">
            <div className="svm-hero-scroll" ref={scrollRef} onScroll={handleScroll}>
              {images.map((url, idx) => (
                <div key={idx} className="svm-hero-slide">
                  <img src={imageUrl(url)} alt={`${serviceTitle} ${idx + 1}`} />
                </div>
              ))}
            </div>

            {hasMultiple && (
              <div className="svm-hero-counter">
                {activeIdx + 1} / {images.length}
              </div>
            )}

            {hasMultiple && (
              <div className="svm-hero-dots">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`svm-hero-dot ${idx === activeIdx ? 'active' : ''}`}
                    onClick={() => handleDotClick(idx)}
                    aria-label={`Photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="svm-hero-icon" style={{ background: serviceColor }}>
              <Icon size={26} strokeWidth={2} />
            </div>
          </div>
        ) : (
          <div
            className="svm-hero svm-hero-placeholder"
            style={{ background: `linear-gradient(135deg, ${serviceColor}25, ${serviceColor}10)` }}
          >
            <div className="svm-hero-icon-center" style={{ background: serviceColor }}>
              <Icon size={32} strokeWidth={2} />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="svm-content">
          <h2 className="svm-title">{serviceTitle}</h2>

          {/* HOURS */}
          <div className="svm-info-card">
            <div className="svm-info-icon" style={{ background: `${serviceColor}15`, color: serviceColor }}>
              <Clock size={16} strokeWidth={2.2} />
            </div>
            <div className="svm-info-text">
              <div className="svm-info-label">Opening Hours</div>
              <div className="svm-info-value">{hoursText}</div>
            </div>
          </div>

          {/* LOCATION */}
          {hasLocation && (
            <div className="svm-info-card">
              <div className="svm-info-icon" style={{ background: `${serviceColor}15`, color: serviceColor }}>
                <MapPin size={16} strokeWidth={2.2} />
              </div>
              <div className="svm-info-text">
                <div className="svm-info-label">Location</div>
                <div className="svm-info-value">{detail.location}</div>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {hasDescription && (
            <div className="svm-section">
              <div className="svm-section-title">
                <FileText size={14} strokeWidth={2.2} style={{ color: serviceColor }} />
                About
              </div>
              <p className="svm-description">{detail.description}</p>
            </div>
          )}

          {!hasImages && !hasLocation && !hasDescription && (
            <p className="svm-empty">No additional information added yet.</p>
          )}
        </div>

        {/* FOOTER */}
        <div className="svm-footer">
          <button
            type="button"
            className="svm-btn-close"
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

export default ServiceViewModal;