// src/contexts/AuthContext.tsx
import React, { createContext, useEffect, useState, useCallback } from 'react';
import {
  tokenService,
  getCurrentUser,
  loginPortal,
  logout as logoutService,
} from '../services/auth';
import type { User, AuthState } from '../types/auth';

// Context type — barcha funksiyalar va state
export interface AuthContextValue extends AuthState {
  /** Email/password orqali kirish */
  login: (hotelName: string, password: string) => Promise<{ success: boolean; error?: string }>;

  /** Token bilan kirish (Google login va Register'dan keyin) */
  loginWithToken: (token: string) => Promise<void>;

  /** Logout — backend va frontend tozalash */
  logout: () => Promise<void>;

  /** User ma'lumotlarini qayta yuklash */
  refreshUser: () => Promise<void>;
}

// Context yaratish
export const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider — App.tsx'ni o'rab oladi
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── User ma'lumotlarini backend'dan olish ──────────────
  const refreshUser = useCallback(async () => {
    if (!tokenService.isValid()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        // Token yaroqsiz — tozalash
        tokenService.remove();
        setUser(null);
      }
    } catch {
      tokenService.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Sahifa ochilganda user'ni yuklash ──────────────────
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Login (hotel name + password) ──────────────────────
  const login = useCallback(
    async (hotelName: string, password: string) => {
      const result = await loginPortal(hotelName, password);

      if (result.success && result.token) {
        await refreshUser();
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Invalid credentials',
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
    window.location.href = '/login';
  }, []);

  // ── Context value ──────────────────────────────────────
  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithToken,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};