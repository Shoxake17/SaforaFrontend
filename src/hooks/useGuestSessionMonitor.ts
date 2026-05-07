// src/hooks/useGuestSessionMonitor.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSessionValid, clearLocalSession } from '@services/guestAuth';

const CHECK_INTERVAL_MS = 30_000; // 30 sekund

export function useGuestSessionMonitor() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      if (!isSessionValid()) {
        console.log('[SessionMonitor] Session expired, redirecting');
        clearLocalSession();
        navigate('/g/register', { replace: true });
      }
    };

    // 1) Darhol bir marta tekshirish
    checkSession();

    // 2) Har 30 sekundda
    const interval = setInterval(checkSession, CHECK_INTERVAL_MS);

    // 3) Foydalanuvchi tab'ga qaytganda
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // 4) Window focus olganda
    const focusHandler = () => checkSession();
    window.addEventListener('focus', focusHandler);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('focus', focusHandler);
    };
  }, [navigate]);
}