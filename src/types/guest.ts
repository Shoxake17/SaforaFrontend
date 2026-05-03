// src/types/guest.ts
// Guest Page va Guest Login uchun barcha TypeScript tiplari

// ═══════════════════════════════════════════════════════
// HOTEL
// ═══════════════════════════════════════════════════════
export interface GuestHotel {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  logo?: string;
  country?: string;
  email?: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════
// ROOM
// ═══════════════════════════════════════════════════════
export interface GuestRoom {
  id: string;
  number: string;
  floor?: number;
  block?: string;
  room_type_name?: string;
}

// ═══════════════════════════════════════════════════════
// SETTINGS — guest page sozlashlari (manager kiritadi)
// ═══════════════════════════════════════════════════════
export interface GuestSettings {
  /** Asosiy rang — Welcome title, tugmalar, accent line */
  primary_color?: string;

  /** Welcome xabari */
  welcome_title?: string;
  welcome_subtitle?: string;

  /** Hotel qoidalari (Skrinshot 1'da ko'rinmaydi, kelajak uchun) */
  hotel_rules?: string;

  /** WiFi ma'lumotlari */
  wifi_name?: string;
  wifi_password?: string;

  /** Aloqa */
  phone?: string;
  whatsapp?: string;

  /** Hero photo (eski - bitta rasm) */
  hero_photo?: string;

  /** Hero photos (yangi - carousel uchun, ko'p rasm) */
  hero_photos?: HeroPhoto[];

  /** Ijtimoiy tarmoqlar */
  instagram?: string;
  facebook?: string;
  telegram?: string;
  whatsapp_channel?: string;
  tripadvisor?: string;

  /** Xarita havolalari */
  google_maps_url?: string;
  yandex_maps_url?: string;
  twogis_url?: string;
}

// ═══════════════════════════════════════════════════════
// HERO PHOTOS (carousel)
// ═══════════════════════════════════════════════════════
export interface HeroPhoto {
  id: string;
  image: string;
  order?: number;
}

// ═══════════════════════════════════════════════════════
// GUEST SESSION (backend'dan kelguvchi to'liq ma'lumot)
// ═══════════════════════════════════════════════════════
export interface GuestSession {
  hotel: GuestHotel;
  room: GuestRoom;
  settings: GuestSettings;
}

// ═══════════════════════════════════════════════════════
// GUEST REGISTER (login form'dan yuboriladi)
// ═══════════════════════════════════════════════════════
export interface GuestRegisterPayload {
  hotel_slug: string;
  room_number: string;
  name: string;
  phone: string;
  email?: string;
  language?: string;
}

export interface GuestRegisterResponse {
  success: boolean;
  guest_id?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════
// WEATHER (Header'dagi 15°C Drizzle uchun)
// ═══════════════════════════════════════════════════════
export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  emoji?: string;
}

// ═══════════════════════════════════════════════════════
// BOTTOM NAV (GuestMainScreen'dagi tab tizimi)
// ═══════════════════════════════════════════════════════
export type GuestTabKey =
  | 'home'
  | 'services'
  | 'market'
  | 'reviews'
  | 'explore';

// ═══════════════════════════════════════════════════════
// ACTION CARDS (6 ta tugma — Call, Message, AI, etc.)
// ═══════════════════════════════════════════════════════
export type GuestActionKey =
  | 'call'
  | 'message'
  | 'ai'
  | 'services'
  | 'request'
  | 'explore';

// ═══════════════════════════════════════════════════════
// LANGUAGE
// ═══════════════════════════════════════════════════════
export type GuestLanguage = 'en' | 'ru' | 'uz';

// ═══════════════════════════════════════════════════════
// API RESPONSE — fetchGuestSession uchun
// ═══════════════════════════════════════════════════════
export interface FetchGuestSessionResult {
  success: boolean;
  hotel?: GuestHotel;
  room?: GuestRoom;
  settings?: GuestSettings;
  error?: string;
}