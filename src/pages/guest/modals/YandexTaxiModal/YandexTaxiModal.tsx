// src/pages/guest/modals/YandexTaxiModal/YandexTaxiModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Clock, FileText, MessageSquare, Loader2, Car,
  AlertTriangle, RefreshCw, ChevronRight,
} from 'lucide-react';
import { createGuestRequest } from '@services/requests';
import { imageUrl } from '@utils/imageUrl';
import { formatNominatimAddress } from '@utils/formatAddress';
import MapPickerModal from '../MapPickerModal/MapPickerModal';
import './YandexTaxiModal.css';

export interface YandexTaxiServiceDetail {
  images?: string[];
  description?: string;
  open_time?: string;
  close_time?: string;
  is_24_hours?: boolean;
  location?: string;
}

interface YandexTaxiModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  accentColor: string;
  serviceDetail?: YandexTaxiServiceDetail;
}

type PickupStatus = 'idle' | 'loading' | 'success' | 'error';

interface Coords { lat: number; lng: number; }

const YandexTaxiModal: React.FC<YandexTaxiModalProps> = ({
  isOpen, onClose, hotelSlug, roomNumber, guestName, accentColor,
  serviceDetail,
}) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [pickupStatus, setPickupStatus] = useState<PickupStatus>('idle');
  const [pickupError, setPickupError] = useState<string | null>(null);

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photos = Array.isArray(serviceDetail?.images) ? serviceDetail!.images : [];
  const hasPhotos = photos.length > 0;

  const description = serviceDetail?.description?.trim() ||
    'Call a taxi to your destination quickly and safely.';

  const isOpenAllDay = !!serviceDetail?.is_24_hours;
  const openTime = serviceDetail?.open_time || '00:00';
  const closeTime = serviceDetail?.close_time || '23:59';
  const hoursLabel = isOpenAllDay ? '24 Hours' : `${openTime} – ${closeTime}`;

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPickupStatus('error');
      setPickupError('GPS is not supported.');
      return;
    }

    setPickupStatus('loading');
    setPickupError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPickupCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=uz,ru,en&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          const data = await res.json();
          // ⭐ Toza manzil
          const cleanAddress = formatNominatimAddress(data);
          setPickupAddress(cleanAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setPickupStatus('success');
        } catch {
          setPickupAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setPickupStatus('success');
        }
      },
      (err) => {
        setPickupStatus('error');
        let msg = 'Location not determined';
        if (err.code === 1) msg = 'Location not allowed';
        else if (err.code === 2) msg = 'GPS is not available';
        else if (err.code === 3) msg = 'Time is up';
        setPickupError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDropoffAddress('');
      setDropoffCoords(null);
      setComments('');
      setError(null);
      setSuccess(false);
      setCurrentPhoto(0);
      setPickupAddress('');
      setPickupCoords(null);
      setPickupStatus('idle');
      setPickupError(null);

      detectLocation();
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (pickupStatus !== 'success' || !pickupAddress) {
      setError('Your location is not determined');
      return;
    }
    if (!dropoffAddress) {
      setError('Choose where you want to go');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGuestRequest({
      hotel_slug: hotelSlug,
      room_number: roomNumber,
      guest_name: guestName,
      service_type: 'yandex_taxi',
      details: {
        pickup_location: pickupAddress,
        pickup_coords: pickupCoords,
        dropoff_location: dropoffAddress,
        dropoff_coords: dropoffCoords,
        comments: comments.trim(),
      },
    });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => onClose(), 2500);
    } else {
      setError(result.error || 'Error sending');
    }
  };

  if (success) {
    return (
      <div className="ytx-overlay" onClick={onClose}>
        <div className="ytx-modal ytx-success" onClick={(e) => e.stopPropagation()}>
          <div className="ytx-success-icon" style={{ background: accentColor }}>
            <Car size={32} strokeWidth={2} />
          </div>
          <h2 className="ytx-success-title">Request sent!</h2>
          <p className="ytx-success-msg">
            The reception called a taxi for you.<br />
            You will receive a notification when the taxi arrives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ytx-overlay" onClick={onClose}>
        <div className="ytx-modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="ytx-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.4} />
          </button>

          {hasPhotos ? (
            <div className="ytx-hero ytx-hero-photo">
              <img src={imageUrl(photos[currentPhoto])} alt="Taxi" className="ytx-hero-img" />
              {photos.length > 1 && (
                <>
                  <div className="ytx-hero-counter">{currentPhoto + 1} / {photos.length}</div>
                  <div className="ytx-hero-dots">
                    {photos.map((_, idx) => (
                      <button key={idx} type="button"
                        className={`ytx-hero-dot ${idx === currentPhoto ? 'active' : ''}`}
                        onClick={() => setCurrentPhoto(idx)}
                        aria-label={`Photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="ytx-hero" style={{ background: `linear-gradient(135deg, ${accentColor}, #ea580c)` }}>
              <Car size={48} strokeWidth={1.8} className="ytx-hero-icon" />
            </div>
          )}

          <div className="ytx-content">
            <h2 className="ytx-title">Request Taxi</h2>

            <div className="ytx-info-card">
              <div className="ytx-info-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
                <Clock size={16} strokeWidth={2.2} />
              </div>
              <div className="ytx-info-text">
                <div className="ytx-info-label">Service Available</div>
                <div className="ytx-info-value">{hoursLabel}</div>
              </div>
            </div>

            <div className="ytx-section">
              <div className="ytx-section-title">
                <FileText size={13} strokeWidth={2.2} style={{ color: accentColor }} />
                About
              </div>
              <p className="ytx-description">{description}</p>
            </div>

            {error && <div className="ytx-error">⚠️ {error}</div>}

            {/* ROUTE */}
            <div className="ytx-route">
              <div className="ytx-route-stop">
                <div className="ytx-route-marker">
                  {pickupStatus === 'success' ? (
                    <div className="ytx-marker-pickup">
                      <span className="ytx-marker-pulse" />
                    </div>
                  ) : pickupStatus === 'error' ? (
                    <div className="ytx-marker-error">
                      <AlertTriangle size={11} strokeWidth={2.6} />
                    </div>
                  ) : (
                    <div className="ytx-marker-loading">
                      <Loader2 size={12} className="ytx-spin" />
                    </div>
                  )}
                </div>

                <div className="ytx-route-content">
                  <div className="ytx-route-label">From</div>

                  {pickupStatus === 'loading' && (
                    <div className="ytx-route-text ytx-route-loading">Location is being determined...</div>
                  )}

                  {pickupStatus === 'success' && (
                    <div className="ytx-route-text" title={pickupAddress}>{pickupAddress}</div>
                  )}

                  {pickupStatus === 'error' && (
                    <div className="ytx-route-text ytx-route-error-text">{pickupError}</div>
                  )}
                </div>

                {(pickupStatus === 'success' || pickupStatus === 'error') && (
                  <button
                    type="button"
                    className="ytx-route-action"
                    onClick={detectLocation}
                    aria-label="Qayta aniqlash"
                  >
                    <RefreshCw size={14} strokeWidth={2.2} />
                  </button>
                )}
              </div>

              <div className="ytx-route-line" />

              <button
                type="button"
                className="ytx-route-stop ytx-route-stop-tap"
                onClick={() => setShowMap(true)}
              >
                <div className="ytx-route-marker">
                  <div className="ytx-marker-dropoff" style={{ background: accentColor }} />
                </div>

                <div className="ytx-route-content">
                  <div className="ytx-route-label">WHERE</div>

                  {dropoffAddress ? (
                    <div className="ytx-route-text" title={dropoffAddress}>{dropoffAddress}</div>
                  ) : (
                    <div className="ytx-route-text ytx-route-placeholder">
                      Choose Location with Map
                    </div>
                  )}
                </div>

                <ChevronRight size={18} strokeWidth={2.2} className="ytx-route-chevron" />
              </button>
            </div>

            <div className="ytx-field">
              <label className="ytx-label">
                <MessageSquare size={11} strokeWidth={2.4} style={{ color: accentColor }} />
                COMMENTS (OPTIONAL)
              </label>
              <textarea
                className="ytx-input ytx-textarea"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Haydovchi uchun qo'shimcha izoh..."
                rows={3}
                maxLength={200}
              />
              <div className="ytx-field-hint" style={{ textAlign: 'right' }}>
                {comments.length}/200
              </div>
            </div>
          </div>

          <div className="ytx-footer">
            <button
              type="button"
              className="ytx-btn-submit"
              onClick={handleSubmit}
              disabled={submitting || pickupStatus !== 'success' || !dropoffAddress}
              style={{ background: accentColor }}
            >
              {submitting ? (
                <><Loader2 size={16} className="ytx-spin" /> Sending...</>
              ) : (
                <><Car size={16} strokeWidth={2.2} /> Request Taxi</>
              )}
            </button>
          </div>
        </div>
      </div>

      {showMap && (
        <MapPickerModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          onSelect={({ address, coords }) => {
            setDropoffAddress(address);
            setDropoffCoords(coords);
          }}
          initialCenter={dropoffCoords || pickupCoords || undefined}
          title="Choose where you want to go"
          accentColor={accentColor}
        />
      )}
    </>
  );
};

export default YandexTaxiModal;