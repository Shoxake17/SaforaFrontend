// src/pages/login/Login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

// ✅ Path alias — toza importlar
import useAuth from '@hooks/useAuth';
import { generateSlug } from '@utils/slug';
import PasswordInput from '@components/ui/PasswordInput';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginPortalAuth } = useAuth();

  const [hotelName, setHotelName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!hotelName.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginPortalAuth(hotelName.trim(), password);

    if (result.success) {
      let portalUrl: string;

      if (result.redirect) {
        portalUrl = result.redirect;
      } else if (result.slug) {
        const slug = generateSlug(hotelName);
        portalUrl = `/portal/${slug}`;
      } else {
        portalUrl = '/dashboard';
      }

      navigate(portalUrl, { replace: true });
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="portal-root">
      <div className="p-left">
        <div className="p-grid"></div>
        <div className="p-orb p-orb-1"></div>
        <div className="p-orb p-orb-2"></div>
        <div className="p-3d-1"></div>
        <div className="p-3d-2"></div>
        <div className="p-3d-3"></div>

        <div className="p-left-inner">
          <div className="p-logo-row">
            <div className="p-logo-mark">
              <div className="nav-logo-icon">
                <img src="/logo.png" alt="Safora" className="navbar-logo" />
              </div>
            </div>
            <span className="p-logo-text">SAFORA</span>
          </div>

          <div className="p-status">
            <span className="p-status-dot"></span>
            System Online
          </div>

          <h1 className="p-headline">
            Your Hotel's<br />
            <span className="p-grad">Command Center</span>
          </h1>
          <p className="p-tagline">
            Reservations, staff, housekeeping, and AI receptionists —
            one elegant platform for modern hotels of any size.
          </p>

          <div className="p-feats">
            <div className="p-feat">
              <div className="p-feat-icon">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <div className="p-feat-t">AI Receptionist — 24/7</div>
                <div className="p-feat-d">Answers calls, books rooms, never misses a guest.</div>
              </div>
            </div>
            <div className="p-feat">
              <div className="p-feat-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <div className="p-feat-t">Live Revenue &amp; Reports</div>
                <div className="p-feat-d">Real-time occupancy, revenue and staff dashboards.</div>
              </div>
            </div>
            <div className="p-feat">
              <div className="p-feat-icon">
                <i className="fa-solid fa-users-gear"></i>
              </div>
              <div>
                <div className="p-feat-t">Full Staff Management</div>
                <div className="p-feat-d">Shifts, salaries and department workflows in one place.</div>
              </div>
            </div>
          </div>

          <div className="p-proof">
            <div className="p-av-stack">
              <div className="p-av">A</div>
              <div className="p-av">N</div>
              <div className="p-av">J</div>
              <div className="p-av p-av-more">+</div>
            </div>
            <div>
              <strong>100+ hotels</strong> across Central Asia
            </div>
          </div>
        </div>
      </div>

      <div className="p-right">
        <div className="p-form-card">
          <span className="pnc pnc-tl"></span>
          <span className="pnc pnc-tr"></span>
          <span className="pnc pnc-bl"></span>
          <span className="pnc pnc-br"></span>

          <div className="pf-tag">
            <i className="fa-solid fa-shield-halved"></i>
            Hotel Portal
          </div>
          <h2 className="pf-title">Welcome Back</h2>
          <p className="pf-sub">Sign in to access your hotel's management system</p>

          {error && (
            <div className="pf-error">
              <i className="fa-solid fa-circle-xmark"></i>
              {error}
            </div>
          )}

          <div className="pf-div">Enter Credentials</div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="pf-field">
              <label className="pf-label">Hotel Name</label>
              <div className="pf-input-wrap">
                <i className="fa-solid fa-hotel fi"></i>
                <input
                  className="pf-input"
                  type="text"
                  name="hotel_name"
                  placeholder="e.g. Grand Palace Hotel"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  autoFocus
                  required
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label">Portal Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Enter portal password"
                name="portal_password"
                required
                autoComplete="current-password"
                variant="login"
              />
            </div>

            <button type="submit" className="pf-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Enter Portal
                </>
              )}
            </button>
          </form>

          <p className="pf-foot">
            New here?{' '}
            <Link to="/register">Register here →</Link>
          </p>
          <div className="pf-brand">Safora • Intelligent Hotel Management</div>
        </div>
      </div>
    </div>
  );
};

export default Login;