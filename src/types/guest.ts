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
// ⭐ COVER PHOTO — Hero carousel (Settings'dan)
// ═══════════════════════════════════════════════════════
export interface CoverPhoto {
  url: string;
  filename?: string;
  uploadedAt?: string;
}

// ═══════════════════════════════════════════════════════
// HERO PHOTOS (eski format — backward compatibility)
// ═══════════════════════════════════════════════════════
export interface HeroPhoto {
  id: string;
  image: string;
  order?: number;
}

// ═══════════════════════════════════════════════════════
// ⭐ WIFI — Settings nested object
// ═══════════════════════════════════════════════════════
export interface GuestWiFi {
  network_name?: string;
  password?: string;
}

// ═══════════════════════════════════════════════════════
// ⭐ SOCIAL MEDIA — Settings nested object
// ═══════════════════════════════════════════════════════
export interface GuestSocialMedia {
  instagram?: string;
  facebook?: string;
  telegram?: string;
  whatsapp_channel?: string;
  tripadvisor?: string;
}

// ═══════════════════════════════════════════════════════
// ⭐ DIRECTIONS — Settings nested object
// ═══════════════════════════════════════════════════════
export interface GuestDirections {
  google_maps?: string;
  yandex_maps?: string;
  twogis?: string;
}

// ═══════════════════════════════════════════════════════
// ⭐ TOURIST RECOMMENDATION
// ═══════════════════════════════════════════════════════
export interface GuestTouristRecommendation {
  _id?: string;
  name: string;
  category: string;  // landmark | restaurant | cafe | attraction | shopping
  address?: string;
  google_maps_link?: string;
  description?: string;
  image_url?: string;
  order?: number;
}

// ═══════════════════════════════════════════════════════
// SETTINGS — guest page sozlashlari (manager kiritadi)
// ═══════════════════════════════════════════════════════
export interface GuestSettings {
  // ─── Theme ───
  primary_color?: string;

  // ─── Welcome ───
  welcome_title?: string;
  welcome_subtitle?: string;
  hotel_rules?: string;

  // ─── ⭐ Cover Photos (Hero carousel) ───
  cover_photos?: CoverPhoto[];

  // ─── Hero photo (eski format — fallback) ───
  hero_photo?: string;
  hero_photos?: HeroPhoto[];

  // ─── ⭐ Contact ───
  reception_phone?: string;
  phone?: string;
  whatsapp?: string;

  // ─── ⭐ WiFi (yangi nested + eski flat) ───
  wifi?: GuestWiFi;
  wifi_name?: string;       // eski flat format
  wifi_password?: string;   // eski flat format

  // ─── ⭐ Social Media (yangi nested + eski flat) ───
  social_media?: GuestSocialMedia;
  instagram?: string;
  facebook?: string;
  telegram?: string;
  whatsapp_channel?: string;
  tripadvisor?: string;

  // ─── ⭐ Directions (yangi nested + eski flat) ───
  directions?: GuestDirections;
  google_maps_url?: string;
  yandex_maps_url?: string;
  twogis_url?: string;
  active_services?: string[];

  // ─── ⭐ Tourist Recommendations ───
  tourist_recommendations?: GuestTouristRecommendation[];
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
// ⭐ GUEST REGISTER PAYLOAD — yangi mobile flow uchun
// ═══════════════════════════════════════════════════════
export interface GuestRegisterPayload {
  fullName: string;
  phone?: string;
  email?: string;
  language?: string;
  hotelSlug: string;
  roomNumber: string;
  checkInDate: string;   // "YYYY-MM-DD"
  checkOutDate: string;  // "YYYY-MM-DD"
}

export interface GuestRegisterResponse {
  success: boolean;
  guest_id?: string;
  token?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════
// ⭐ LOCAL SESSION INFO — localStorage'da saqlanadigan
// ═══════════════════════════════════════════════════════
export interface LocalGuestSession {
  hotelSlug: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guestName?: string;
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
  | 'user'
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