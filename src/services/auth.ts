// src/services/auth.ts
import { API_URL } from '../config/api';
import type { RegisterResponse } from '../types/register';
import type { User, LoginResponse, MeResponse } from '../types/auth';
import type { Hotel } from '../types/hotel';

const TOKEN_KEY = 'safora_token';

// ═══════════════════════════════════════════════════════
// Token helpers — har joydan import qilib ishlatsa bo'ladi
// ═══════════════════════════════════════════════════════
export const tokenService = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),

  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),

  remove: (): void => localStorage.removeItem(TOKEN_KEY),

  isValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    return token.length > 0;
  },
};

// ═══════════════════════════════════════════════════════
// Base fetch wrapper — auth header avtomatik qo'shadi
// ═══════════════════════════════════════════════════════
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = tokenService.get();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });
};

// ═══════════════════════════════════════════════════════
// REGISTER — biznes ro'yxatga olish
// ═══════════════════════════════════════════════════════
export const registerBusiness = async (formData: FormData): Promise<RegisterResponse> => {
  try {
    const response = await authFetch('/auth/register', {
      method: 'POST',
      body: formData,
    });

    const data: RegisterResponse = await response.json();

    if (response.ok && data.success && data.token) {
      tokenService.set(data.token);
    }

    return data;
  } catch {
    return {
      success: false,
      error: "Tarmoq xatosi. Qaytadan urinib ko'ring.",
    };
  }
};

// ═══════════════════════════════════════════════════════
// PORTAL LOGIN — Hotel Name + Portal Password
// (Login.tsx sahifasidan ishlatiladi)
// ═══════════════════════════════════════════════════════
export const loginPortal = async (
  hotelName: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await authFetch('/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel_name: hotelName,
        portal_password: password,
      }),
    });

    const data: LoginResponse = await response.json();

    if (response.ok && data.success && data.token) {
      tokenService.set(data.token);
    }

    return data;
  } catch {
    return {
      success: false,
      error: "Tarmoq xatosi. Qaytadan urinib ko'ring.",
    };
  }
};

// ═══════════════════════════════════════════════════════
// ⭐ YANGI — USER LOGIN (Username/Email + Password)
// (RoleLogin.tsx sahifasidan ishlatiladi)
// ═══════════════════════════════════════════════════════
export const loginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await authFetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data: LoginResponse = await response.json();

    if (response.ok && data.success && data.token) {
      tokenService.set(data.token);
    }

    return data;
  } catch {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
};

// ═══════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════
export const logout = async (): Promise<void> => {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Tarmoq xatosi bo'lsa ham token o'chirish kerak
  } finally {
    tokenService.remove();
  }
};

// ═══════════════════════════════════════════════════════
// ME — joriy foydalanuvchi
// ═══════════════════════════════════════════════════════
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await authFetch('/auth/me');
    if (!response.ok) return null;

    const data: MeResponse = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════
// ⭐ YANGI — getMe with Hotel
// (Dashboard.tsx sahifasidan ishlatiladi)
// User + Hotel ma'lumotlarini birga qaytaradi
// ═══════════════════════════════════════════════════════
export interface MeWithHotelResponse {
  success: boolean;
  user: User | null;
  hotel: Hotel | null;
  error?: string;
}

export const getMeWithHotel = async (): Promise<MeWithHotelResponse> => {
  try {
    const response = await authFetch('/auth/me');

    if (!response.ok) {
      return {
        success: false,
        user: null,
        hotel: null,
        error: 'Unauthorized',
      };
    }

    const data = await response.json();

    return {
      success: data.success || false,
      user: data.user || null,
      hotel: data.hotel || null,
    };
  } catch {
    return {
      success: false,
      user: null,
      hotel: null,
      error: 'Network error',
    };
  }
};

// ═══════════════════════════════════════════════════════
// ⭐ YANGI — FETCH HOTEL BY SLUG
// (HotelPortal.tsx, RoleLogin.tsx, Dashboard.tsx dan ishlatiladi)
// ═══════════════════════════════════════════════════════
export interface HotelFetchResult {
  success: boolean;
  hotel: Hotel | null;
  error?: string;
  status?: number;
}

export const fetchHotelBySlug = async (slug: string): Promise<HotelFetchResult> => {
  try {
    const response = await fetch(`${API_URL}/portal/${slug}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return {
        success: false,
        hotel: null,
        error: 'Hotel topilmadi',
        status: 404,
      };
    }

    const data = await response.json();

    if (data.success && data.hotel) {
      return {
        success: true,
        hotel: data.hotel,
        status: response.status,
      };
    }

    return {
      success: false,
      hotel: null,
      error: data.error || "Hotel ma'lumotlarini yuklashda xato",
      status: response.status,
    };
  } catch (err) {
    console.error('fetchHotelBySlug error:', err);
    return {
      success: false,
      hotel: null,
      error: 'Tarmoq xatosi',
    };
  }
};