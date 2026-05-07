// src/pages/StepAccountOne.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import type { GoogleUser } from '../../types/register';
import GoogleIcon from '../../components/UI/GoogleIcon';
import { API_URL } from '@config/api';
interface StepAccountProps {
  email: string;
  setEmail: (v: string) => void;
  googleUser: GoogleUser | null;
  onContinue: () => void;
}

const StepAccount: React.FC<StepAccountProps> = ({
  email,
  setEmail,
  googleUser,
  onContinue,
}) => (
  <div className="reg-panel">
    {/* Icon */}
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <div className="reg-step-icon">
        <i className="fa-solid fa-envelope" />
      </div>
    </div>

    <h2 className="reg-panel-title" style={{ textAlign: 'center' }}>
      Create Your Account
    </h2>
    <p className="reg-panel-desc" style={{ textAlign: 'center' }}>
      Start with your email or Google account
    </p>

    {googleUser ? (
      /* â”€â”€ Google verified â”€â”€ */
      <>
        <div className="reg-google-verified">
          <GoogleIcon />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
              Google account verified
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{googleUser.email}</div>
          </div>
          <i
            className="fa-solid fa-circle-check"
            style={{ color: '#16a34a', fontSize: 18 }}
          />
        </div>

        <button type="button" className="reg-btn reg-btn-primary" onClick={onContinue}>
          Continue <i className="fa-solid fa-arrow-right ms-2" />
        </button>
      </>
    ) : (
      <>
        <a
          href={`${API_URL}/auth/google/login?flow=register`}
          className="google-signup-btn"
        >
          <GoogleIcon />
          Sign up with Google
        </a>

        <div className="reg-divider">
          <span>or enter your email</span>
        </div>

        <div className="reg-fields">
          <div className="reg-field">
            <label className="reg-label">
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="button"
          className="reg-btn reg-btn-primary"
          onClick={onContinue}
          disabled={!email}
          style={{ marginTop: 20 }}
        >
          Continue <i className="fa-solid fa-arrow-right ms-2" />
        </button>
      </>
    )}

    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <Link to="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
        Already have an account?{' '}
        <span style={{ color: '#f97316', fontWeight: 600 }}>Sign in</span>
      </Link>
    </div>
  </div>
);

export default StepAccount;