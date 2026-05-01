// src/contexts/AuthContext.tsx
import React, { createContext, useEffect, useState, useCallback } from 'react';
import {
  tokenService,
  loginPortal,
  loginUser as loginUserService,
  logout as logoutService,
  getMeWithHotel,
} from '../services/auth';
import type { User, AuthState } from '../types/auth';
import type { Hotel } from '../types/hotel';

// ═══════════════════════════════════════════════════════
// Context type — barcha funksiyalar va state
// ═══════════════════════════════════════════════════════
export interface AuthContextValue extends AuthState {
  /** Hotel ma'lumotlari (Dashboard uchun) */
  hotel: Hotel | null;

  /** Hotel name + portal password orqali kirish (Login.tsx uchun) */
  loginPortalAuth: (
    hotelName: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; redirect?: string; slug?: string }>;

  /** Username + password orqali kirish (RoleLogin.tsx uchun) */
  loginUserAuth: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  /** Token bilan kirish (Google login va Register'dan keyin) */
  loginWithToken: (token: string) => Promise<void>;

  /** Logout — backend va frontend tozalash */
  logout: () => Promise<void>;

  /** User + Hotel ma'lumotlarini qayta yuklash */
  refreshUser: () => Promise<void>;
}

// Context yaratish
export const AuthContext = createContext<AuthContextValue | null>(null);

// ═══════════════════════════════════════════════════════
// AuthProvider — App.tsx'ni o'rab oladi
// ═══════════════════════════════════════════════════════
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── User + Hotel ma'lumotlarini backend'dan olish ──────
  const refreshUser = useCallback(async () => {
    if (!tokenService.isValid()) {
      setUser(null);
      setHotel(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getMeWithHotel();
      if (result.success && result.user) {
        setUser(result.user);
        if (result.hotel) {
          setHotel(result.hotel);
        }
      } else {
        // Token yaroqsiz — tozalash
        tokenService.remove();
        setUser(null);
        setHotel(null);
      }
    } catch {
      tokenService.remove();
      setUser(null);
      setHotel(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Sahifa ochilganda user'ni yuklash ──────────────────
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Login (hotel name + portal password) — Login.tsx ───
  const loginPortalAuth = useCallback(
    async (hotelName: string, password: string) => {
      const result = await loginPortal(hotelName, password);

      if (result.success && result.token) {
        await refreshUser();
        return {
          success: true,
          redirect: result.redirect,
          slug: result.user?.hotel_id ? hotelName : undefined,
        };
      }

      return {
        success: false,
        error: result.error || 'Invalid credentials',
      };
    },
    [refreshUser]
  );

  // ── Login (username + password) — RoleLogin.tsx ────────
  const loginUserAuth = useCallback(
    async (username: string, password: string) => {
      const result = await loginUserService(username, password);

      if (result.success && result.token) {
        await refreshUser();
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Invalid username or password',
      };
    },
    [refreshUser]
  );

  // ── Token bilan login (Google va Register uchun) ───────
  const loginWithToken = useCallback(
    async (token: string) => {
      tokenService.set(token);
      await refreshUser();
    },
    [refreshUser]
  );

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
    setHotel(null);
  }, []);

  // ── Context value ──────────────────────────────────────
  const value: AuthContextValue = {
    user,
    hotel,
    isAuthenticated: !!user,
    isLoading,
    loginPortalAuth,
    loginUserAuth,
    loginWithToken,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};