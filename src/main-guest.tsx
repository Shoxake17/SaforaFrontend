// src/main-guest.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { ThemeProvider } from './contexts/ThemeContext';
import FirebaseInit from './components/FirebaseInit/FirebaseInit';
import GuestLoginPage from './pages/guest/GuestLoginPage';
import MobileRegisterPage from './pages/guest/MobileRegisterPage';
import {
  isSessionValid,
  getLocalSession,
  clearLocalSession,
} from './services/guestAuth';
import './index.css';

const SmartEntry: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getLocalSession();

    if (!isSessionValid() || !session) {
      clearLocalSession();
      navigate('/g/register', { replace: true });
    } else {
      navigate(`/g/${session.hotelSlug}/${session.roomNumber}`, {
        replace: true,
      });
    }
  }, [navigate]);

  return null;
};

// ═══════════════════════════════════════════════════════
// APP ENTRY
// ═══════════════════════════════════════════════════════
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FirebaseInit />
      <BrowserRouter>
        <Routes>
          {/* Boot routing — foydalanuvchi ko'rmaydi, faqat redirect */}
          <Route path="/" element={<SmartEntry />} />

          {/* GUEST sahifalari — barchasi /g/ ostida */}
          <Route path="/g/register" element={<MobileRegisterPage />} />
          <Route path="/g/:slug/:roomNumber" element={<GuestLoginPage />} />

          {/* Boshqa hamma URL → register'ga (manager URL'lariga yo'l yo'q) */}
          <Route path="*" element={<Navigate to="/g/register" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);