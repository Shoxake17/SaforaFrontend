// src/hooks/firebase/useFirebase.ts
import { useEffect, useState, useRef } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { API_URL } from '@config/api';
interface FirebaseState {
  token: string | null;
  isReady: boolean;
  error: string | null;
}

const useFirebase = () => {
  const [state, setState] = useState<FirebaseState>({
    token: null,
    isReady: false,
    error: null,
  });

  // Token'ni saqlash uchun ref (closure muammosini hal qiladi)
  const fcmTokenRef = useRef<string | null>(null);
  const sentForKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[Firebase] Web platformda - FCM ishlamaydi');
      return;
    }

    const initFirebase = async () => {
      try {
        console.log('[Firebase] Init boshlandi');

        const permResult = await PushNotifications.requestPermissions();
        console.log('[Firebase] Ruxsat status:', permResult.receive);
        
        if (permResult.receive !== 'granted') {
          setState((s) => ({ ...s, error: 'Push notifications ruxsat berilmadi' }));
          return;
        }

        await PushNotifications.register();
        console.log('[Firebase] Register qilindi');

        PushNotifications.addListener('registration', async (token) => {
          console.log('[Firebase] ✅ FCM Token olindi:', token.value.substring(0, 30) + '...');
          fcmTokenRef.current = token.value;
          setState({ token: token.value, isReady: true, error: null });

          // Hozirda mavjud auth token bilan yuborish
          await tryToSendToken();
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[Firebase] ❌ Token registration error:', error);
          setState((s) => ({ ...s, error: error.error }));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Firebase] 📩 Push notification keldi:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Firebase] 👆 Notification action:', action);
        });
      } catch (err) {
        console.error('[Firebase] Init error:', err);
        setState((s) => ({ ...s, error: (err as Error).message }));
      }
    };

    // Token yuborish funksiyasi - HAR XIL token kalitlarini sinaydi
    const tryToSendToken = async () => {
      if (!fcmTokenRef.current) {
        console.log('[Firebase] FCM token hali yo\'q');
        return;
      }

      const apiUrl = API_URL;

      // ⭐ Mehmon token (safora_guest_token)
      const guestToken = localStorage.getItem('safora_guest_token');
      if (guestToken && !sentForKeysRef.current.has('guest:' + guestToken)) {
        try {
          console.log('[Firebase] Mehmon token uchun FCM yuborilyapti...');
          const response = await fetch(`${apiUrl}/guest/auth/fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${guestToken}`,
            },
            body: JSON.stringify({ fcmToken: fcmTokenRef.current, device: 'android' }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Firebase] ✅ Mehmon FCM token saqlandi:', data);
            sentForKeysRef.current.add('guest:' + guestToken);
          } else {
            console.warn('[Firebase] ⚠️ Mehmon endpoint:', response.status);
          }
        } catch (err) {
          console.error('[Firebase] Mehmon token yuborish xato:', err);
        }
      }

      // ⭐ Manager token (safora_token)
      const managerToken = localStorage.getItem('safora_token');
      if (managerToken && !sentForKeysRef.current.has('manager:' + managerToken)) {
        try {
          console.log('[Firebase] Manager token uchun FCM yuborilyapti...');
          const response = await fetch(`${apiUrl}/auth/fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${managerToken}`,
            },
            body: JSON.stringify({ fcmToken: fcmTokenRef.current, device: 'android' }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Firebase] ✅ Manager FCM token saqlandi:', data);
            sentForKeysRef.current.add('manager:' + managerToken);
          } else {
            console.warn('[Firebase] ⚠️ Manager endpoint:', response.status);
          }
        } catch (err) {
          console.error('[Firebase] Manager token yuborish xato:', err);
        }
      }

      if (!guestToken && !managerToken) {
        console.log('[Firebase] ⏳ Auth token hali yo\'q (login kutmoqda)');
      }
    };

    // Init
    initFirebase();

    // ⭐ HAR 5 SONIYA TOKEN YUBORIB SINAYMIZ (login bo'lguncha)
    const interval = setInterval(tryToSendToken, 5000);

    // localStorage o'zgarsa ham yuborish
    const handleStorage = () => tryToSendToken();
    window.addEventListener('storage', handleStorage);

    return () => {
      PushNotifications.removeAllListeners();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return state;
};

export default useFirebase;