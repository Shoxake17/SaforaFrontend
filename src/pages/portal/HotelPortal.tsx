// src/pages/portal/HotelPortal.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useForceTheme from '@hooks/useForceTheme'
import {
  Loader2,
  CircleAlert,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  ShieldCheck,
  ConciergeBell,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import './HotelPortal.css';

// ✅ Path alias — toza importlar
import { API_URL } from '@config/api';
import { imageUrl } from '@utils/imageUrl';
import { fetchHotelBySlug } from '@services/auth';
import type { Hotel } from '@apptypes/hotel';

const HotelPortal: React.FC = () => {
  useForceTheme('light');
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carouselIdx, setCarouselIdx] = useState(0);

  // ─── Hotel fetch ─────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    const loadHotel = async () => {
      const result = await fetchHotelBySlug(slug);

      if (result.success && result.hotel) {
        setHotel(result.hotel);
      } else {
        setError(result.error || 'Hotel topilmadi');
      }

      setLoading(false);
    };

    loadHotel();
  }, [slug]);

  // ─── Carousel auto-rotate ────────────────────────────
  useEffect(() => {
    if (!hotel?.images || hotel.images.length <= 1) return;

    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % (hotel.images?.length || 1));
    }, 4500);

    return () => clearInterval(timer);
  }, [hotel?.images]);

  // ─── Loading state ───────────────────────────────────
  if (loading) {
    return (
      <div className="hp-loading">
        <Loader2 size={36} color="#f97316" className="hp-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────
  if (error || !hotel) {
    return (
      <div className="hp-error">
        <CircleAlert size={48} color="#dc2626" />
        <h2>{error || 'Hotel topilmadi'}</h2>
        <p>URL'ni tekshirib ko'ring yoki ro'yxatdan o'ting</p>
        <Link to="/" className="hp-btn-back">
          <ArrowLeft size={14} strokeWidth={2.2} /> Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const hasImages = hotel.images && hotel.images.length > 0;
  const isQrOnly = hotel.service_type === 'qr_only';

  return (
    <div className="portal-root">
      {/* ═══ LEFT: carousel / brand ═══ */}
      <div className="p-left">
        {hasImages ? (
          <div className="carousel">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {hotel.images!.map((img, i) => (
                <div key={i} className="carousel-slide">
                    <img src={imageUrl(img.url)} alt={hotel.name} />
                  <div className="carousel-overlay" />
                </div>
              ))}
            </div>

            <Link to="/" className="carousel-back">
              <ArrowLeft size={14} strokeWidth={2.2} /> Back
            </Link>

            <div className="carousel-info">
              <div className="carousel-hotel">{hotel.name}</div>
              <div className="carousel-hotel-sub">Hotel Management Portal</div>
              <div className="carousel-badge">
                <div className="carousel-badge-dot" />
                System Online
              </div>
            </div>

            {hotel.images!.length > 1 && (
              <div className="carousel-nav">
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={() =>
                    setCarouselIdx(
                      (p) =>
                        (p - 1 + hotel.images!.length) % hotel.images!.length
                    )
                  }
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={18} strokeWidth={2.2} />
                </button>
                <div className="carousel-dots">
                  {hotel.images!.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`carousel-dot ${i === carouselIdx ? 'active' : ''}`}
                      onClick={() => setCarouselIdx(i)}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="carousel-btn"
                  onClick={() =>
                    setCarouselIdx((p) => (p + 1) % hotel.images!.length)
                  }
                  aria-label="Next slide"
                >
                  <ChevronRight size={18} strokeWidth={2.2} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-left-brand">
            <div className="brand-dot" />
            <div className="fb3d fb3d-1" />
            <div className="fb3d fb3d-2" />
            <div className="fb3d fb3d-3" />
            <div className="brand-inner">
              <img src="/logo.png" alt="Safora" className="brand-logo" />
              <div className="brand-name">{hotel.name}</div>
              <div className="brand-sub">Hotel Management Portal</div>
            </div>
            <Link to="/" className="carousel-back" style={{ zIndex: 10 }}>
              <ArrowLeft size={14} strokeWidth={2.2} /> Back
            </Link>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: section cards ═══ */}
      <div className="p-right">
        <div className="p-right-dot" />
        <div className="p-right-orb p-right-orb-1" />
        <div className="p-right-orb p-right-orb-2" />

        <div className="p-header">
          <div className="p-emblem">
            <img src="/logo.png" alt="Safora" />
          </div>
          <div>
            <div className="p-hotel-name">{hotel.name}</div>
            <div className="p-hotel-sub">Select your section</div>
          </div>
          <div className="p-online">
            <div className="p-online-dot" />
            Online
          </div>
        </div>

        <div className="p-section-label">
          <Grid3x3
            size={11}
            strokeWidth={2.2}
            style={{ color: 'rgba(249,115,22,.45)' }}
          />
          Sections
        </div>

        <div className="cards-area">
          {/* ─── Management ─── */}
          {!isQrOnly && (
            <button
              type="button"
              onClick={() => navigate(`/portal/${slug}/login/management`)}
              className="s-card t-orange"
            >
              <div className="s-stripe" />
              <div className="s-glow" />
              <div className="s-top">
                <div className="s-icon">
                  <ShieldCheck size={22} strokeWidth={2.2} />
                </div>
                <div className="s-info">
                  <div className="s-label">Manager Access</div>
                  <div className="s-title">Management</div>
                </div>
              </div>
              <div className="s-desc">
                Dashboard, staff, reservations, analytics &amp; settings.
              </div>
              <div className="s-action">
                <div className="s-signin">Sign in</div>
                <div className="s-arrow">
                  <ArrowRight size={14} strokeWidth={2.4} />
                </div>
              </div>
            </button>
          )}

          {/* ─── Front Desk ─── */}
          <button
            type="button"
            onClick={() => navigate(`/portal/${slug}/login/frontdesk`)}
            className="s-card t-red"
          >
            <div className="s-stripe" />
            <div className="s-glow" />
            <div className="s-top">
              <div className="s-icon">
                <ConciergeBell size={22} strokeWidth={2.2} />
              </div>
              <div className="s-info">
                <div className="s-label">Receptionist Access</div>
                <div className="s-title">{isQrOnly ? 'Reception' : 'Front Desk'}</div>
              </div>
            </div>
            <div className="s-desc">
              {isQrOnly
                ? 'Manage QR room orders, guest requests & notifications.'
                : 'Check-ins, check-outs, walk-ins & guest billing.'}
            </div>
            <div className="s-action">
              <div className="s-signin">Sign in</div>
              <div className="s-arrow">
                <ArrowRight size={14} strokeWidth={2.4} />
              </div>
            </div>
          </button>

          {/* ─── Housekeeping ─── */}
          {!isQrOnly && (
            <button
              type="button"
              onClick={() => navigate(`/portal/${slug}/login/housekeeping`)}
              className="s-card t-warm"
            >
              <div className="s-stripe" />
              <div className="s-glow" />
              <div className="s-top">
                <div className="s-icon">
                  <Sparkles size={22} strokeWidth={2.2} />
                </div>
                <div className="s-info">
                  <div className="s-label">Housekeeping Staff</div>
                  <div className="s-title">Housekeeping</div>
                </div>
              </div>
              <div className="s-desc">
                Room assignments, cleaning status &amp; task management.
              </div>
              <div className="s-action">
                <div className="s-signin">Sign in</div>
                <div className="s-arrow">
                  <ArrowRight size={14} strokeWidth={2.4} />
                </div>
              </div>
            </button>
          )}

          {/* ─── Dept Manager / QR Manager ─── */}
          <button
            type="button"
            onClick={() => navigate(`/portal/${slug}/login/dept-manager`)}
            className="s-card t-rose"
          >
            <div className="s-stripe" />
            <div className="s-glow" />
            <div className="s-top">
              <div className="s-icon">
                <UsersRound size={22} strokeWidth={2.2} />
              </div>
              <div className="s-info">
                <div className="s-label">
                  {isQrOnly ? 'QR Manager' : 'Department Manager'}
                </div>
                <div className="s-title">
                  {isQrOnly ? 'QR Manager' : 'Dept Manager'}
                </div>
              </div>
            </div>
            <div className="s-desc">
              {isQrOnly
                ? 'QR codes, rooms, staff & service management.'
                : 'Department staff, roster, tasks & reports.'}
            </div>
            <div className="s-action">
              <div className="s-signin">Sign in</div>
              <div className="s-arrow">
                <ArrowRight size={14} strokeWidth={2.4} />
              </div>
            </div>
          </button>
        </div>

        <div className="p-footer">{hotel.name} • Powered by Safora</div>
      </div>
    </div>
  );
};

export default HotelPortal;