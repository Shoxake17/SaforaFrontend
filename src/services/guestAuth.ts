// src/services/guestAuth.ts
import { API_URL } from '../config/api';
import { guestTokenService } from './guestToken';
import type {
  GuestRegisterPayload,
  LocalGuestSession,
} from '@apptypes/guest';

// ═══════════════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════
const LS_KEYS = {
  HOTEL_SLUG: 'safora_last_hotel_slug',
  ROOM_NUMBER: 'safora_last_room_number',
  CHECK_OUT_DATE: 'safora_check_out_date',
  CHECK_IN_DATE: 'safora_check_in_date',
  GUEST_NAME: 'safora_guest_name',
} as const;

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export interface GuestAccount {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  language: string;
  checkInDate?: string;   // ⭐ YANGI
  checkOutDate?: string;  // ⭐ YANGI
  totalCalls?: number;
  totalOrders?: number;
  totalRequests?: number;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface GuestAuthResult {
  success: boolean;
  token?: string;
  guest?: GuestAccount;
  error?: string;
}

// ═══════════════════════════════════════════════════════
// HELPER — token bilan fetch
// ═══════════════════════════════════════════════════════
const guestAuthFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = guestTokenService.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
};

// ═══════════════════════════════════════════════════════
// ⭐ REGISTER — yangi check-in/out flow bilan
// ═══════════════════════════════════════════════════════
export async function registerOrLoginGuest(
  params: GuestRegisterPayload
): Promise<GuestAuthResult> {
  try {
    const response = await guestAuthFetch('/guest/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: params.fullName,
        phone: params.phone || '',
        email: params.email || '',
        language: params.language || 'en',
        hotelSlug: params.hotelSlug,
        roomNumber: params.roomNumber,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
      }),
    });

    const data: GuestAuthResult = await response.json();

    if (data.success && data.token) {
      guestTokenService.set(data.token);

      // ⭐ Local session saqlash
      saveLocalSession({
        hotelSlug: params.hotelSlug,
        roomNumber: params.roomNumber,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        guestName: params.fullName,
      });
    }

    return data;
  } catch (err) {
    console.error('[guestAuth] register error:', err);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// ═══════════════════════════════════════════════════════
// LOGIN — faqat telefon orqali
// ═══════════════════════════════════════════════════════
export async function loginGuestByPhone(params: {
  phone: string;
  hotelSlug?: string;
  roomNumber?: string;
}): Promise<GuestAuthResult> {
  try {
    const response = await guestAuthFetch('/guest/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (data.success && data.token) {
      guestTokenService.set(data.token);
    }

    return data;
  } catch (err) {
    console.error('[guestAuth] login error:', err);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// ═══════════════════════════════════════════════════════
// GET ME — joriy foydalanuvchi (token kerak)
// ═══════════════════════════════════════════════════════
export async function getCurrentGuest(): Promise<GuestAccount | null> {
  try {
    const token = guestTokenService.get();
    if (!token) return null;

    const response = await guestAuthFetch('/guest/auth/me');

    if (!response.ok) {
      // Token yaroqsiz / muddati o'tgan — to'liq tozalash
      if (response.status === 401) {
        clearLocalSession();
      }
      return null;
    }

    const data = await response.json();
    return data.success && data.guest ? data.guest : null;
  } catch (err) {
    console.error('[guestAuth] getCurrentGuest error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// UPDATE ME — profilni yangilash
// ═══════════════════════════════════════════════════════
export async function updateMyProfile(params: {
  fullName?: string;
  email?: string;
  language?: string;
}): Promise<GuestAuthResult> {
  try {
    const response = await guestAuthFetch('/guest/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[guestAuth] updateMyProfile error:', err);
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// ═══════════════════════════════════════════════════════
// ⭐ LOGOUT — to'liq tozalash
// ═══════════════════════════════════════════════════════
export function logoutGuest(): void {
  clearLocalSession();
}

// ═══════════════════════════════════════════════════════
// ⭐ LOCAL SESSION — localStorage helpers
// ═══════════════════════════════════════════════════════
export function saveLocalSession(session: LocalGuestSession): void {
  localStorage.setItem(LS_KEYS.HOTEL_SLUG, session.hotelSlug);
  localStorage.setItem(LS_KEYS.ROOM_NUMBER, session.roomNumber);
  localStorage.setItem(LS_KEYS.CHECK_IN_DATE, session.checkInDate);
  localStorage.setItem(LS_KEYS.CHECK_OUT_DATE, session.checkOutDate);
  if (session.guestName) {
    localStorage.setItem(LS_KEYS.GUEST_NAME, session.guestName);
  }
}

export function getLocalSession(): LocalGuestSession | null {
  const hotelSlug = localStorage.getItem(LS_KEYS.HOTEL_SLUG);
  const roomNumber = localStorage.getItem(LS_KEYS.ROOM_NUMBER);
  const checkInDate = localStorage.getItem(LS_KEYS.CHECK_IN_DATE);
  const checkOutDate = localStorage.getItem(LS_KEYS.CHECK_OUT_DATE);

  if (!hotelSlug || !roomNumber || !checkOutDate) {
    return null;
  }

  return {
    hotelSlug,
    roomNumber,
    checkInDate: checkInDate || '',
    checkOutDate,
    guestName: localStorage.getItem(LS_KEYS.GUEST_NAME) || undefined,
  };
}

export function clearLocalSession(): void {
  guestTokenService.remove();
  localStorage.removeItem(LS_KEYS.HOTEL_SLUG);
  localStorage.removeItem(LS_KEYS.ROOM_NUMBER);
  localStorage.removeItem(LS_KEYS.CHECK_IN_DATE);
  localStorage.removeItem(LS_KEYS.CHECK_OUT_DATE);
  localStorage.removeItem(LS_KEYS.GUEST_NAME);
}

// ═══════════════════════════════════════════════════════
// ⭐ SESSION EXPIRY CHECK — checkOutDate o'tganmi
// ═══════════════════════════════════════════════════════
export function isSessionExpired(): boolean {
  const session = getLocalSession();
  if (!session) return true;

  const now = new Date();
  const checkOut = new Date(session.checkOutDate);
  // checkOut kunining oxirigacha (23:59:59)
  checkOut.setHours(23, 59, 59, 999);

  return now > checkOut;
}

export function isSessionValid(): boolean {
  const token = guestTokenService.get();
  if (!token) return false;
  if (isSessionExpired()) return false;
  return true;
}

// ═══════════════════════════════════════════════════════
// MY CALLS — calls tarixi
// ═══════════════════════════════════════════════════════
export interface GuestCallHistory {
  id: string;
  roomNumber: string;
  status: string;
  duration: number;
  answeredByName: string;
  answeredAt?: string;
  endedAt?: string;
  createdAt: string;
}

export async function getMyCalls(): Promise<GuestCallHistory[]> {
  try {
    const response = await guestAuthFetch('/guest/auth/me/calls');
    if (!response.ok) return [];

    const data = await response.json();
    return data.success && Array.isArray(data.calls) ? data.calls : [];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// HEARTBEAT — har 10 sekundda backend'ga ping
// ═══════════════════════════════════════════════════════
export async function sendHeartbeat(params: {
  hotelSlug?: string;
  roomNumber?: string;
}): Promise<boolean> {
  try {
    const response = await guestAuthFetch('/guest/auth/me/heartbeat', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (response.status === 401) {
      try {
        const data = await response.clone().json();
        if (data.code === 'STAY_ENDED') {
          console.log('[Heartbeat] Stay ended on backend, logging out');
          clearLocalSession();
          window.location.href = '/g/register';
          return false;
        }
      } catch {
      }
    }
    return response.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// INCOMING CALL POLLING
// ═══════════════════════════════════════════════════════
export interface IncomingCallForGuest {
  hasCall: boolean;
  callId?: string;
  roomNumber?: string;
  offerSdp?: string;
  initiatedByName?: string;
  createdAt?: string;
}

export async function checkIncomingCall(
  roomNumber?: string
): Promise<IncomingCallForGuest> {
  try {
    const url = roomNumber
      ? `/guest/auth/me/incoming-call?roomNumber=${encodeURIComponent(roomNumber)}`
      : '/guest/auth/me/incoming-call';

    const response = await guestAuthFetch(url);
    if (!response.ok) return { hasCall: false };

    const data = await response.json();
    return data;
  } catch {
    return { hasCall: false };
  }
}