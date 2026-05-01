// src/types/register.ts
// ═══════════════════════════════════════════════════════
// 📝 Register form uchun TypeScript types
// ═══════════════════════════════════════════════════════

// ✅ BusinessType va ServiceType endi hotel.ts dan keladi
// Re-export — eski importlar ham ishlaydi
import type { BusinessType, ServiceType, Hotel } from './hotel';
export type { BusinessType, ServiceType };

// ═══════════════════════════════════════════════════════
// Google OAuth user
// ═══════════════════════════════════════════════════════
export interface GoogleUser {
  email: string;
  googleId: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
}

// ═══════════════════════════════════════════════════════
// Hotel form data — register paytida ishlatiladi
// ═══════════════════════════════════════════════════════
export interface HotelData {
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  rules: string;
  portal_password: string;
  portal_password_confirm: string;
  reception_pc_count: number;
}

// ═══════════════════════════════════════════════════════
// Manager form data — register paytida ishlatiladi
// ═══════════════════════════════════════════════════════
export interface ManagerData {
  first_name: string;
  last_name: string;
  username: string;
  password1: string;
  password2: string;
}

// ═══════════════════════════════════════════════════════
// Form state — useRegisterForm hook'da ishlatiladi
// ═══════════════════════════════════════════════════════
export interface RegisterFormState {
  currentStep: number;
  email: string;
  googleUser: GoogleUser | null;
  serviceType: ServiceType | null;
  businessType: BusinessType | null;
  hotelData: HotelData;
  managerData: ManagerData;
  photoFiles: File[];
  formError: string;
  submitting: boolean;
}

// ═══════════════════════════════════════════════════════
// API response — Backend qaytaradi (Register endpoint'idan)
// ═══════════════════════════════════════════════════════
export interface RegisterResponse {
  success: boolean;
  message?: string;
  token?: string;
  hotel_slug?: string;      
  redirect?: string;        
  error?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  hotel?: Hotel;           
}