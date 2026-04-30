// src/pages/dashboard/RoleLogin.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './RoleLogin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Rol konfiguratsiyasi — har bir rol uchun ma'lumot
type RoleKey = 'management' | 'frontdesk' | 'housekeeping' | 'dept-manager';

interface RoleConfig {
  badge: string;
  icon: string;
  title: string;
  desc: string;
  features: { icon: string; text: string }[];
  theme: 'orange' | 'red' | 'warm' | 'rose';
}

const ROLE_CONFIG: Record<RoleKey, RoleConfig> = {
  management: {
    badge: 'MANAGER ACCESS',
    icon: 'fa-shield-halved',
    title: 'Management',
    desc: 'Full hotel management — staff, reservations, analytics & settings.',
    features: [
      { icon: 'fa-chart-line', text: 'Real-time analytics & reports' },
      { icon: 'fa-users-gear', text: 'Staff & department management' },
      { icon: 'fa-calendar-check', text: 'Reservations & bookings' },
    ],
    theme: 'orange',
  },
  frontdesk: {
    badge: 'RECEPTIONIST ACCESS',
    icon: 'fa-concierge-bell',
    title: 'Front Desk',
    desc: 'Check-ins, check-outs, walk-ins & guest billing.',
    features: [
      { icon: 'fa-right-to-bracket', text: 'Check-in & check-out' },
      { icon: 'fa-bed', text: 'Room availability' },
      { icon: 'fa-receipt', text: 'Guest billing' },
    ],
    theme: 'red',
  },
  housekeeping: {
    badge: 'HOUSEKEEPING STAFF',
    icon: 'fa-broom',
    title: 'Housekeeping',
    desc: 'Room assignments, cleaning status & task management.',
    features: [
      { icon: 'fa-list-check', text: 'View assigned rooms' },
      { icon: 'fa-spray-can', text: 'Update cleaning status' },
      { icon: 'fa-bell', text: 'Maintenance alerts' },
    ],
    theme: 'warm',
  },
  'dept-manager': {
    badge: 'QR MANAGER ACCESS',
    icon: 'fa-qrcode',
    title: 'QR Manager',
    desc: 'QR codes, rooms, staff & service management.',
    features: [
      { icon: 'fa-list-check', text: 'View your assigned tasks' },
      { icon: 'fa-bed', text: 'Update room cleaning status' },
      { icon: 'fa-triangle-exclamation', text: 'Urgent task priority alerts' },
    ],
    theme: 'rose',
  },
};

// ═══════════════════════════════════════════════════════
// Hotel interfeysi
// ═══════════════════════════════════════════════════════
interface Hotel {
  id: string;
  name: string;
  slug: string;
  country: string;
  service_type: 'full' | 'qr_only';
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const RoleLogin: React.FC = () => {
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelLoading, setHotelLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Hotel ma'lumotlarini olish ──────────────────────
  useEffect(() => {
    if (!slug) return;

    const fetchHotel = async () => {
      try {
        const response = await fetch(`${API_URL}/portal/${slug}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success && data.hotel) {
          setHotel(data.hotel);
        }
      } catch {
        // ignore — sahifa baribir ko'rsatiladi
      } finally {
        setHotelLoading(false);
      }
    };

    fetchHotel();
  }, [slug]);

  // ── Rol konfiguratsiyasi ─────────────────────────────
  const roleKey = (role || 'management') as RoleKey;
  const config = ROLE_CONFIG[roleKey] || ROLE_CONFIG.management;

  // ── Login submit ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Token saqlash
        localStorage.setItem('safora_token', data.token);

        // Dashboard'ga yo'naltirish (rolga qarab)
        navigate(`/portal/${slug}/${roleKey}/dashboard`, { replace: true });
      } else {
        setError(data.error || 'Invalid username or password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rl-root rl-theme-${config.theme}`}>
      {/* ════════ LEFT — Brand & Info ════════ */}
      <div className="rl-left">
        <div className="rl-bg-orb rl-bg-orb-1"></div>
        <div className="rl-bg-orb rl-bg-orb-2"></div>
        <div className="rl-bg-dot"></div>

        {/* Back button */}
        <Link to={`/portal/${slug}`} className="rl-back">
          <i className="fa-solid fa-arrow-left"></i>{' '}
          {hotelLoading ? 'Back' : hotel?.name || 'Back'}
        </Link>

        <div className="rl-left-inner">
          {/* Big Icon */}
          <div className="rl-big-icon">
            <i className={`fa-solid ${config.icon}`}></i>
          </div>

          {/* Title */}
          <h1 className="rl-big-title">{config.title}</h1>
          <p className="rl-big-desc">{config.desc}</p>

          {/* Features list */}
          <div className="rl-features">
            {config.features.map((f, i) => (
              <div key={i} className="rl-feature">
                <i className={`fa-solid ${f.icon}`}></i>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotel name footer */}
        {hotel && (
          <div className="rl-hotel-foot">
            <i className="fa-solid fa-hotel"></i> {hotel.name}
            {hotel.country && ` — ${hotel.country}`}
          </div>
        )}
      </div>

      {/* ════════ RIGHT — Login Form ════════ */}
      <div className="rl-right">
        <div className="rl-form">
          {/* Badge */}
          <div className="rl-badge">
            <i className="fa-solid fa-grip"></i>
            {config.badge}
          </div>

          {/* Title */}
          <h2 className="rl-form-title">Sign In</h2>
          <p className="rl-form-sub">
            Enter your credentials to access {config.title}.
          </p>

          {/* Error */}
          {error && (
            <div className="rl-error">
              <i className="fa-solid fa-circle-xmark"></i>
              <div>
                <div className="rl-error-title">Invalid username or password.</div>
                <div className="rl-error-desc">
                  Please enter a correct username and password. Note that both fields may be case-sensitive.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username */}
            <div className="rl-field">
              <label className="rl-label">USERNAME</label>
              <div className="rl-input-wrap">
                <i className="fa-solid fa-user fi"></i>
                <input
                  className="rl-input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="rl-field">
              <label className="rl-label">PASSWORD</label>
              <div className="rl-input-wrap">
                <i className="fa-solid fa-lock fi"></i>
                <input
                  className="rl-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="rl-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="rl-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Sign In to {config.title}
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="rl-foot-note">
            <i className="fa-solid fa-shield-halved"></i>
            Access is restricted to authorised {config.title} staff only.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleLogin;