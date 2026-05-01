// src/pages/portal/RoleLogin.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useForceTheme from '@hooks/useForceTheme';
import {
  ArrowLeft,
  Grid3x3,
  CircleX,
  User,
  LogIn,
  Loader2,
  ShieldCheck,
  Hotel as HotelIcon,
} from 'lucide-react';
import './RoleLogin.css';

// ✅ Path alias — toza importlar
import useAuth from '@hooks/useAuth';
import { fetchHotelBySlug } from '@services/auth';
import { getRoleConfig } from '@config/roles';
import type { RoleKey } from '@config/roles';
import type { Hotel } from '@apptypes/hotel';
import PasswordInput from '@components/ui/PasswordInput';

const RoleLogin: React.FC = () => {
  useForceTheme('light');
  const { slug, role } = useParams<{ slug: string; role: RoleKey }>();
  const navigate = useNavigate();
  const { loginUserAuth } = useAuth();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelLoading, setHotelLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Hotel fetch ──────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    const loadHotel = async () => {
      const result = await fetchHotelBySlug(slug);
      if (result.success && result.hotel) {
        setHotel(result.hotel);
      }
      setHotelLoading(false);
    };

    loadHotel();
  }, [slug]);

  const roleKey = (role || 'management') as RoleKey;
  const config = getRoleConfig(role);

  // Role icon — Lucide komponenti
  const RoleIcon = config.icon;

  // ─── Submit handler ───────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginUserAuth(username, password);

    if (result.success) {
      navigate(`/portal/${slug}/${roleKey}/dashboard`, { replace: true });
    } else {
      setError(result.error || 'Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <div className={`rl-root rl-theme-${config.theme}`}>
      {/* ═══ LEFT: brand & info ═══ */}
      <div className="rl-left">
        <div className="rl-bg-orb rl-bg-orb-1" />
        <div className="rl-bg-orb rl-bg-orb-2" />
        <div className="rl-bg-dot" />

        <Link to={`/portal/${slug}`} className="rl-back">
          <ArrowLeft size={13} strokeWidth={2.4} />
          <span>{hotelLoading ? 'Back' : hotel?.name || 'Back'}</span>
        </Link>

        <div className="rl-left-inner">
          <div className="rl-big-icon">
            <RoleIcon size={40} strokeWidth={2} />
          </div>

          <h1 className="rl-big-title">{config.loginTitle}</h1>
          <p className="rl-big-desc">{config.loginDesc}</p>

          <div className="rl-features">
            {config.loginFeatures.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <div key={i} className="rl-feature">
                  <span className="rl-feature-icon">
                    <FeatureIcon size={14} strokeWidth={2.2} />
                  </span>
                  <span>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {hotel && (
          <div className="rl-hotel-foot">
            <HotelIcon size={13} strokeWidth={2.2} />
            <span>
              {hotel.name}
              {hotel.country && ` — ${hotel.country}`}
            </span>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: login form ═══ */}
      <div className="rl-right">
        <div className="rl-form">
          <div className="rl-badge">
            <Grid3x3 size={11} strokeWidth={2.4} />
            <span>{config.badge}</span>
          </div>

          <h2 className="rl-form-title">Sign In</h2>
          <p className="rl-form-sub">
            Enter your credentials to access {config.loginTitle}.
          </p>

          {error && (
            <div className="rl-error">
              <CircleX size={16} strokeWidth={2.2} className="rl-error-icon" />
              <div>
                <div className="rl-error-title">Invalid username or password.</div>
                <div className="rl-error-desc">
                  Please enter a correct username and password. Note that both fields may be case-sensitive.
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username field */}
            <div className="rl-field">
              <label className="rl-label">USERNAME</label>
              <div className="rl-input-wrap">
                <User size={15} strokeWidth={2.2} className="fi" />
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

            {/* Password field */}
            <div className="rl-field">
              <label className="rl-label">PASSWORD</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                variant="role-login"
              />
            </div>

            {/* Submit button */}
            <button type="submit" className="rl-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} strokeWidth={2.4} className="rl-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} strokeWidth={2.4} />
                  <span>Sign In to {config.loginTitle}</span>
                </>
              )}
            </button>
          </form>

          <div className="rl-foot-note">
            <ShieldCheck size={13} strokeWidth={2.2} className="rl-foot-icon" />
            <span>
              Access is restricted to authorised {config.loginTitle} staff only.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleLogin;