// src/types/auth.ts


export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: 'manager' | 'receptionist' | 'admin' | 'staff';
  photo?: string;
  hotel_id?: string;
  hotel_name?: string;
}

// ───────────────────────────────────────────────────────
// Login response — backend qaytaradigan format
// ───────────────────────────────────────────────────────
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  redirect?: string;
  error?: string;
}

// ───────────────────────────────────────────────────────
// /auth/me response
// ───────────────────────────────────────────────────────
export interface MeResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// ───────────────────────────────────────────────────────
// AuthContext'da ishlatilinadigan state
// ───────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}