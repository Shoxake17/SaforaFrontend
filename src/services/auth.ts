// src/services/auth.ts
import type { RegisterResponse } from '../types/register';
import type { User, LoginResponse, MeResponse } from '../types/auth';

const API_BASE = '';
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

  return fetch(`${API_BASE}${url}`, {
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
      // FormData bilan Content-Type qo'ymaymiz — browser o'zi qo'yadi
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
// Backend response:
//   {
//     success: true,
//     hotel: { slug: "grand-palace-hotel", ... },
//     redirect: "/dashboard/grand-palace-hotel"
//   }
// ═══════════════════════════════════════════════════════
export const loginPortal = async (
  hotelName: string,
  password: string
): Promise<LoginResponse> => {
  try {
    // Backend route: POST /portal (sizning authController'da)
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