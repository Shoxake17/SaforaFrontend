// src/services/guestAuth.ts
import { API_URL } from '../config/api';
import { guestTokenService } from './guestToken';

export interface GuestAccount {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  language: string;
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

// Helper token bilan fetch
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

// REGISTER yoki LOGIN telefon mavjud bo'lsa avtomatik login qiladi
export async function registerOrLoginGuest(params: {
  fullName: string;
  phone: string;
  email?: string;
  language?: string;
  hotelSlug?: string;
  roomNumber?: string;
}): Promise<GuestAuthResult> {
  try {
    const response = await guestAuthFetch('/guest/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (data.success && data.token) {
      guestTokenService.set(data.token);
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

// LOGIN Ã¢â‚¬â€ faqat telefon orqali (account mavjud bo'lishi kerak)
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

// GET ME Ã¢â‚¬â€ joriy foydalanuvchi (token kerak)
export async function getCurrentGuest(): Promise<GuestAccount | null> {
  try {
    const token = guestTokenService.get();
    if (!token) return null;

    const response = await guestAuthFetch('/guest/auth/me');

    if (!response.ok) {
      // Token yaroqsiz Ã¢â‚¬â€ tozalash
      if (response.status === 401) {
        guestTokenService.remove();
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

// UPDATE ME Ã¢â‚¬â€ profilni yangilash
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

// LOGOUT Ã¢â‚¬â€ token tozalash (server'da hech narsa qilmaydi)
export function logoutGuest(): void {
  guestTokenService.remove();
}

// MY CALLS Ã¢â‚¬â€ calls tarixi
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


// HEARTBEAT Ã¢â‚¬â€ har 10 sekundda backend'ga ping
// "Men hali bu yerdaman" signal
// 
export async function sendHeartbeat(params: {
  hotelSlug?: string;
  roomNumber?: string;
}): Promise<boolean> {
  try {
    const response = await guestAuthFetch('/guest/auth/me/heartbeat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.ok;
  } catch {
    return false;
  }
}


// Ã¢Â­Â YANGI Ã¢â‚¬â€ Manager dan kelayotgan call bormi tekshirish
// (har 3 sek polling)
export interface IncomingCallForGuest {
  hasCall: boolean;
  callId?: string;
  roomNumber?: string;
  offerSdp?: string;
  initiatedByName?: string;
  createdAt?: string;
}

// Manager dan kelayotgan call bormi tekshirish (har 3 sek polling)
// Ã¢Â­Â roomNumber yuborish Ã¢â‚¬â€ bir xil mehmon turli xonalarda login qilsa filter uchun
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