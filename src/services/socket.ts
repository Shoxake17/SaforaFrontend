// src/services/socket.ts
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

const SOCKET_URL = Capacitor.isNativePlatform()
  ? 'https://v1kmtz97-5000.euw.devtunnels.ms'   // mobile
  : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

// ═══════════════════════════════════════════════════════
// Socket Singleton — bitta connection butun app uchun
// ═══════════════════════════════════════════════════════
let socketInstance: Socket | null = null;
let currentToken: string | null = null;

/**
 * Socket connection yaratish (yoki mavjudini qaytarish)
 * @param token - JWT token (guest yoki staff)
 */
export function getSocket(token: string): Socket {
  // ⭐ Agar mavjud socket bor va bir xil token —
  // connected bo'lsa ham, connecting bo'lsa ham — uni qaytaramiz
  if (socketInstance && currentToken === token) {
    // Faqat haqiqatan ham yopilgan (manual disconnect) bo'lsa qayta yaratamiz
    if (
      !socketInstance.connected &&
      socketInstance.disconnected &&
      !socketInstance.active // active=false → manual disconnect
    ) {
      console.log('[Socket] Existing socket is dead, recreating...');
      socketInstance.removeAllListeners();
      socketInstance = null;
    } else {
      // Mavjud socket'ni qaytaramiz (connected yoki connecting)
      return socketInstance;
    }
  }

  // ⭐ Boshqa tokenli socket bor bo'lsa — yopamiz
  if (socketInstance && currentToken !== token) {
    console.log('[Socket] Token changed, replacing socket');
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  // Yangi socket yaratish
  console.log('[Socket] Creating new socket connection to', SOCKET_URL);
  currentToken = token;
  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20_000,
    autoConnect: true,
  });

  socketInstance.on('connect', () => {
    console.log('✅ [Socket] Connected:', socketInstance?.id);
  });

  socketInstance.on('connect_error', err => {
    console.warn('⚠️ [Socket] Connection error:', err.message);
  });

  socketInstance.on('disconnect', reason => {
    console.log('🔌 [Socket] Disconnected:', reason);
  });

  socketInstance.on('reconnect', attempt => {
    console.log('🔄 [Socket] Reconnected after', attempt, 'attempts');
  });

  return socketInstance;
}

/**
 * Socket disconnect (logout paytida)
 */
export function disconnectSocket() {
  if (socketInstance) {
    console.log('[Socket] Manual disconnect');
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    currentToken = null;
  }
}

/**
 * Socket mavjud va ulangan?
 */
export function isSocketConnected(): boolean {
  return !!(socketInstance && socketInstance.connected);
}

/**
 * Mavjud socket'ni olish (yangisini yaratmasdan)
 */
export function getCurrentSocket(): Socket | null {
  return socketInstance;
}