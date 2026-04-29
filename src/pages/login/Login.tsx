import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './Login.css';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hotelName.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_name: hotelName,
          portal_password: password,
        }),
      });

      const data = await response.json();
      if (data.ok || response.ok) {
        window.location.href = data.redirect || '/dashboard/';
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-root">

      {/* ════════ LEFT — Brand Panel ════════ */}
      <div className="p-left">
        <div className="p-grid"></div>
        <div className="p-orb p-orb-1"></div>
        <div className="p-orb p-orb-2"></div>
        <div className="p-3d-1"></div>
        <div className="p-3d-2"></div>
        <div className="p-3d-3"></div>

        <div className="p-left-inner">

          {/* Logo */}
          <div className="p-logo-row">
            <div className="p-logo-mark">
              <div className="p-logo-fallback">S</div>
            </div>
            <span className="p-logo-text">SAFORA</span>
          </div>

          {/* Status */}
          <div className="p-status">
            <span className="p-status-dot"></span>
            System Online
          </div>

          {/* Headline */}
          <h1 className="p-headline">
            Your Hotel's<br />
            <span className="p-grad">Command Center</span>
          </h1>
          <p className="p-tagline">
            Reservations, staff, housekeeping, and AI receptionists —
            one elegant platform for modern hotels of any size.
          </p>

          {/* Features */}
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

          {/* Social proof */}
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

      {/* ════════ RIGHT — Login Form ════════ */}
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
                />
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label">Portal Password</label>
              <div className="pf-input-wrap">
                <i className="fa-solid fa-lock fi"></i>
                <input
                  className="pf-input"
                  type={showPassword ? 'text' : 'password'}
                  name="portal_password"
                  placeholder="Enter portal password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pf-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
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