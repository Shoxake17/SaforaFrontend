// src/types/register.ts

export interface GoogleUser {
  email: string;
  googleId: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
}

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

export interface ManagerData {
  first_name: string;
  last_name: string;
  username: string;
  password1: string;
  password2: string;
}

export type ServiceType = 'full' | 'qr_only';
export type BusinessType = 'hotel' | 'hostel' | 'guest_house';

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
// API response — Backend qaytaradi
// ═══════════════════════════════════════════════════════
export interface RegisterResponse {
  success: boolean;
  message?: string;
  token?: string;
  hotel_slug?: string;       // ← Backend qaytaradi: "grand-palace-hotel"
  redirect?: string;         // ← Backend qaytaradi: "/portal/grand-palace-hotel/"
  error?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  hotel?: {
    id: string;
    name: string;
    slug: string;
    business_type: string;
    service_type: string;
  };
}