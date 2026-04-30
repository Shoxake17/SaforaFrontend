// src/pages/portal/HotelPortal.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './HotelPortal.css';

// ═══════════════════════════════════════════════════════
// API URL — Vite proxy bypass tufayli aniq backend URL ishlatamiz
// ═══════════════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface HotelImage {
  url: string;
  filename: string;
}

interface Hotel {
  id: string;
  name: string;
  slug: string;
  business_type: 'hotel' | 'hostel' | 'guest_house';
  service_type: 'full' | 'qr_only';
  images?: HotelImage[];
}

const HotelPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carouselIdx, setCarouselIdx] = useState(0);

  // ── Hotel ma'lumotlarini olish ──────────────────────
  useEffect(() => {
    if (!slug) return;

    const fetchHotel = async () => {
      try {
        // ✅ ACCEPT: application/json header bilan — Vite proxy backend'ga uzatadi
        const response = await fetch(`${API_URL}/portal/${slug}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          setError('Hotel topilmadi');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success && data.hotel) {
          setHotel(data.hotel);
        } else {
          setError(data.error || "Hotel ma'lumotlarini yuklashda xato");
        }
      } catch (err) {
        console.error('HotelPortal fetch xatosi:', err);
        setError('Tarmoq xatosi');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [slug]);

  // ── Carousel auto-rotate ────────────────────────────
  useEffect(() => {
    if (!hotel?.images || hotel.images.length <= 1) return;

    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % (hotel.images?.length || 1));
    }, 4500);

    return () => clearInterval(timer);
  }, [hotel?.images]);

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="hp-loading">
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 36, color: '#f97316' }} />
        <p>Loading...</p>
      </div>
    );
  }

  // ── Error / 404 ──────────────────────────────────────
  if (error || !hotel) {
    return (
      <div className="hp-error">
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: '#dc2626' }} />
        <h2>{error || 'Hotel topilmadi'}</h2>
        <p>URL'ni tekshirib ko'ring yoki ro'yxatdan o'ting</p>
        <Link to="/" className="hp-btn-back">← Bosh sahifaga qaytish</Link>
      </div>
    );
  }

  const hasImages = hotel.images && hotel.images.length > 0;
  const isQrOnly = hotel.service_type === 'qr_only';

  return (
    <div className="portal-root">
      {/* ════════ LEFT — Carousel ════════ */}
      <div className="p-left">
        {hasImages ? (
          <div className="carousel">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {hotel.images!.map((img, i) => (
                <div key={i} className="carousel-slide">
                  {/* ✅ Rasm URL'iga API_URL qo'shamiz */}
                  <img src={`${API_URL}${img.url}`} alt={hotel.name} />
                  <div className="carousel-overlay"></div>
                </div>
              ))}
            </div>

            <Link to="/" className="carousel-back">
              <i className="fa-solid fa-arrow-left"></i> Back
            </Link>

            <div className="carousel-info">
              <div className="carousel-hotel">{hotel.name}</div>
              <div className="carousel-hotel-sub">Hotel Management Portal</div>
              <div className="carousel-badge">
                <div className="carousel-badge-dot"></div>
                System Online
              </div>
            </div>

            {hotel.images!.length > 1 && (
              <div className="carousel-nav">
                <button
                  className="carousel-btn"
                  onClick={() => setCarouselIdx((p) => (p - 1 + hotel.images!.length) % hotel.images!.length)}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="carousel-dots">
                  {hotel.images!.map((_, i) => (
                    <button
                      key={i}
                      className={`carousel-dot ${i === carouselIdx ? 'active' : ''}`}
                      onClick={() => setCarouselIdx(i)}
                    />
                  ))}
                </div>
                <button
                  className="carousel-btn"
                  onClick={() => setCarouselIdx((p) => (p + 1) % hotel.images!.length)}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-left-brand">
            <div className="brand-dot"></div>
            <div className="fb3d fb3d-1"></div>
            <div className="fb3d fb3d-2"></div>
            <div className="fb3d fb3d-3"></div>
            <div className="brand-inner">
              <img src="/logo.png" alt="Safora" className="brand-logo" />
              <div className="brand-name">{hotel.name}</div>
              <div className="brand-sub">Hotel Management Portal</div>
            </div>
            <Link to="/" className="carousel-back" style={{ zIndex: 10 }}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </Link>
          </div>
        )}
      </div>

      {/* ════════ RIGHT — Cards ════════ */}
      <div className="p-right">
        <div className="p-right-dot"></div>
        <div className="p-right-orb p-right-orb-1"></div>
        <div className="p-right-orb p-right-orb-2"></div>

        {/* Header */}
        <div className="p-header">
          <div className="p-emblem">
            <img src="/logo.png" alt="Safora" />
          </div>
          <div>
            <div className="p-hotel-name">{hotel.name}</div>
            <div className="p-hotel-sub">Select your section</div>
          </div>
          <div className="p-online">
            <div className="p-online-dot"></div>
            Online
          </div>
        </div>

        <div className="p-section-label">
          <i className="fa-solid fa-grip" style={{ fontSize: 9, color: 'rgba(249,115,22,.3)' }}></i>
          Sections
        </div>

        {/* Cards */}
        <div className="cards-area">
          {/* Management — Full service uchun */}
          {!isQrOnly && (
            <button
              type="button"
              onClick={() => navigate(`/portal/${slug}/login/management`)}
              className="s-card t-orange"
            >
              <div className="s-stripe"></div>
              <div className="s-glow"></div>
              <div className="s-top">
                <div className="s-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <div className="s-info">
                  <div className="s-label">Manager Access</div>
                  <div className="s-title">Management</div>
                </div>
              </div>
              <div className="s-desc">Dashboard, staff, reservations, analytics &amp; settings.</div>
              <div className="s-action">
                <div className="s-signin">Sign in</div>
                <div className="s-arrow"><i className="fa-solid fa-arrow-right"></i></div>
              </div>
            </button>
          )}

          {/* Front Desk / Reception */}
          <button
            type="button"
            onClick={() => navigate(`/portal/${slug}/login/frontdesk`)}
            className="s-card t-red"
          >
            <div className="s-stripe"></div>
            <div className="s-glow"></div>
            <div className="s-top">
              <div className="s-icon"><i className="fa-solid fa-concierge-bell"></i></div>
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
              <div className="s-arrow"><i className="fa-solid fa-arrow-right"></i></div>
            </div>
          </button>

          {/* Housekeeping — Full service uchun */}
          {!isQrOnly && (
            <button
              type="button"
              onClick={() => navigate(`/portal/${slug}/login/housekeeping`)}
              className="s-card t-warm"
            >
              <div className="s-stripe"></div>
              <div className="s-glow"></div>
              <div className="s-top">
                <div className="s-icon"><i className="fa-solid fa-broom"></i></div>
                <div className="s-info">
                  <div className="s-label">Housekeeping Staff</div>
                  <div className="s-title">Housekeeping</div>
                </div>
              </div>
              <div className="s-desc">Room assignments, cleaning status &amp; task management.</div>
              <div className="s-action">
                <div className="s-signin">Sign in</div>
                <div className="s-arrow"><i className="fa-solid fa-arrow-right"></i></div>
              </div>
            </button>
          )}

          {/* Department Manager / QR Manager */}
          <button
            type="button"
            onClick={() => navigate(`/portal/${slug}/login/dept-manager`)}
            className="s-card t-rose"
          >
            <div className="s-stripe"></div>
            <div className="s-glow"></div>
            <div className="s-top">
              <div className="s-icon"><i className="fa-solid fa-users-gear"></i></div>
              <div className="s-info">
                <div className="s-label">{isQrOnly ? 'QR Manager' : 'Department Manager'}</div>
                <div className="s-title">{isQrOnly ? 'QR Manager' : 'Dept Manager'}</div>
              </div>
            </div>
            <div className="s-desc">
              {isQrOnly
                ? 'QR codes, rooms, staff & service management.'
                : 'Department staff, roster, tasks & reports.'}
            </div>
            <div className="s-action">
              <div className="s-signin">Sign in</div>
              <div className="s-arrow"><i className="fa-solid fa-arrow-right"></i></div>
            </div>
          </button>
        </div>

        <div className="p-footer">{hotel.name} • Powered by Safora</div>
      </div>
    </div>
  );
};

export default HotelPortal;