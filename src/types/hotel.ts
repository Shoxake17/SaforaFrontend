// src/types/hotel.ts
// ═══════════════════════════════════════════════════════
// 🏨 Hotel TypeScript types — markaziy joy
// Hamma joyda shu yerdan import qilinadi
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// Business va Service turlari
// ─────────────────────────────────────────────
export type BusinessType = 'hotel' | 'hostel' | 'guest_house';

export type ServiceType = 'full' | 'qr_only';

// ─────────────────────────────────────────────
// Hotel rasmi
// ─────────────────────────────────────────────
export interface HotelImage {
  url: string;
  filename: string;
  is_primary?: boolean;
  uploadedAt?: string;
  _id?: string;
  id?: string;
}

// ─────────────────────────────────────────────
// To'liq Hotel obyekti — backend qaytaradigan barcha maydonlar
// ─────────────────────────────────────────────
export interface Hotel {
  // Identifikatorlar
  id: string;
  slug: string;

  // Asosiy ma'lumotlar
  name: string;
  business_type: BusinessType;
  service_type: ServiceType;

  // Joylashuv
  country?: string;
  city?: string;
  address?: string;

  // Aloqa
  phone?: string;
  email?: string;

  // Rasmlar va kontent
  images?: HotelImage[];
  rules?: string;

  // Holat
  isActive?: boolean;
  isVerified?: boolean;

  // Kelajak uchun
  reception_pc_count?: number;
}

// ─────────────────────────────────────────────
// Qisqartirilgan Hotel — faqat asosiy maydonlar
// (sidebar, badge, mini ko'rinishlar uchun)
// ─────────────────────────────────────────────
export interface HotelMinimal {
  id: string;
  name: string;
  slug: string;
  service_type: ServiceType;
}

// ─────────────────────────────────────────────
// API response — Hotel olish
// ─────────────────────────────────────────────
export interface HotelResponse {
  success: boolean;
  hotel?: Hotel;
  error?: string;
}