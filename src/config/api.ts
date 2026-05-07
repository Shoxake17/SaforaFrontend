// src/config/api.ts
import { Capacitor } from '@capacitor/core';

// ⭐ Telefon (APK) tunnel URL ishlatadi
// ⭐ Web brauzer .env'dagi localhost ishlatadi
const TUNNEL_URL = 'https://v1kmtz97-5000.euw.devtunnels.ms/api';
const LOCAL_URL = 'http://localhost:5000/api';

export const API_URL = Capacitor.isNativePlatform()
  ? TUNNEL_URL
  : (import.meta.env.VITE_API_URL || LOCAL_URL);

console.log('[API] Platform:', Capacitor.getPlatform());
console.log('[API] URL:', API_URL);