// src/components/FirebaseInit/FirebaseInit.tsx
import { useEffect } from 'react';
import useFirebase from '@hooks/firebase/useFirebase';

/**
 * FirebaseInit — Firebase'ni ishga tushiruvchi komponent
 * App.tsx ichida bir marta chaqirilishi kerak (AuthProvider ichida)
 * Token olib backend'ga yuboradi
 */
const FirebaseInit: React.FC = () => {
  const { token, isReady, error } = useFirebase();

  useEffect(() => {
    if (isReady && token) {
      console.log('[FirebaseInit] ✅ FCM Token tayyor:', token.substring(0, 30) + '...');
    }
    if (error) {
      console.warn('[FirebaseInit] ⚠️ Xato:', error);
    }
  }, [token, isReady, error]);

  // Bu komponent UI ko'rsatmaydi
  return null;
};

export default FirebaseInit;