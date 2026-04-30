// src/pages/auth/GoogleSuccess.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';


const GoogleSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false); 
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    // Tokenni saqlash (Register.tsx bilan bir xil kalit)
    localStorage.setItem('safora_token', token);

    // Dashboard'ga o'tish
    window.location.href = `/portal/${hotelSlug}`;
  }, [searchParams, navigate]);

  // Loading ekrani
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(170deg, #ffffff 0%, #fffaf5 30%, #fff5eb 70%, #fefcfa 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <i
          className="fa-solid fa-spinner fa-spin"
          style={{ fontSize: 40, color: '#f97316', marginBottom: 20 }}
        />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 6px',
          }}
        >
          Signing you in...
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Please wait, redirecting to dashboard
        </p>
      </div>
    </div>
  );
};

export default GoogleSuccess;