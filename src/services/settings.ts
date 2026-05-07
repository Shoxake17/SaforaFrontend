// src/services/settings.ts
import { API_URL } from '@config/api';
import { tokenService } from './auth';

const authHeaders = (): Record<string, string> => {
  const token = tokenService.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeJson = async (res: Response): Promise<any> => {
  try {
    return await res.json();
  } catch {
    return { success: false, error: `HTTP ${res.status}` };
  }
};

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
export type RecommendationCategory =
  | 'landmark' | 'restaurant' | 'cafe' | 'attraction' | 'shopping';

export const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = [
  'landmark', 'restaurant', 'cafe', 'attraction', 'shopping',
];

export interface CoverPhoto {
  url: string;
  filename?: string;
  uploadedAt?: string;
}

export interface WiFiNetwork {
  network_name: string;
  password: string;
}

export interface SocialMedia {
  instagram: string;
  facebook: string;
  telegram: string;
  whatsapp_channel: string;
  tripadvisor: string;
}

export interface Directions {
  google_maps: string;
  yandex_maps: string;
  twogis: string;
}

export interface TouristRecommendation {
  _id?: string;
  name: string;
  category: RecommendationCategory;
  address: string;
  google_maps_link: string;
  description: string;
  image_url: string;
  latitude?: number | null;
  longitude?: number | null;
  open_hours?: string;
  order?: number;
}

// ⭐ Universal Service Detail — Gym, Spa, Pool, Laundry
export interface ServiceDetail {
  images: string[];         // ⭐ "images" — PLURAL!
  description: string;
  open_time: string;
  close_time: string;
  is_24_hours: boolean;
  location: string;
}

export type GymDetails = ServiceDetail;
export type SpaDetails = ServiceDetail;

export interface HotelSettings {
  cover_photos: CoverPhoto[];
  welcome_title: string;
  welcome_subtitle: string;
  hotel_rules: string;
  reception_phone: string;
  whatsapp: string;
  wifi: WiFiNetwork[];
  social_media: SocialMedia;
  directions: Directions;
  tourist_recommendations: TouristRecommendation[];
  active_services: string[];
  gym: ServiceDetail;
  spa: ServiceDetail;
  pool: ServiceDetail;
  laundry: ServiceDetail;
}

export interface SettingsResponse {
  success: boolean;
  error?: string;
  settings?: HotelSettings;
}

export interface CoverPhotosResponse {
  success: boolean;
  error?: string;
  cover_photos?: CoverPhoto[];
  message?: string;
}

export interface UploadImageResponse {
  success: boolean;
  error?: string;
  url?: string;
}

// ⭐ Defaults — "images" PLURAL!
export const DEFAULT_GYM: ServiceDetail = {
  images: [],             // ⭐ images
  description: '',
  open_time: '06:00',
  close_time: '23:00',
  is_24_hours: false,
  location: '',
};

export const DEFAULT_SPA: ServiceDetail = {
  images: [],
  description: '',
  open_time: '09:00',
  close_time: '21:00',
  is_24_hours: false,
  location: '',
};

export const DEFAULT_POOL: ServiceDetail = {
  images: [],
  description: '',
  open_time: '08:00',
  close_time: '22:00',
  is_24_hours: false,
  location: '',
};

export const DEFAULT_LAUNDRY: ServiceDetail = {
  images: [],
  description: '',
  open_time: '09:00',
  close_time: '20:00',
  is_24_hours: false,
  location: '',
};

export const DEFAULT_SETTINGS: HotelSettings = {
  cover_photos: [],
  welcome_title: '',
  welcome_subtitle: '',
  hotel_rules: '',
  reception_phone: '',
  whatsapp: '',
  wifi: [],
  social_media: {
    instagram: '', facebook: '', telegram: '',
    whatsapp_channel: '', tripadvisor: '',
  },
  directions: { google_maps: '', yandex_maps: '', twogis: '' },
  tourist_recommendations: [],
  active_services: ['roomService', 'concierge', 'wifi'],
  gym:     { ...DEFAULT_GYM },
  spa:     { ...DEFAULT_SPA },
  pool:    { ...DEFAULT_POOL },
  laundry: { ...DEFAULT_LAUNDRY },
};

// ⭐ Helper — har service uchun xavfsiz merge
const mergeServiceDetail = (raw: any, defaults: ServiceDetail): ServiceDetail => {
  if (!raw) return defaults;
  return {
    images: Array.isArray(raw.images) ? raw.images : [],
    description: raw.description || '',
    open_time: raw.open_time || defaults.open_time,
    close_time: raw.close_time || defaults.close_time,
    is_24_hours: !!raw.is_24_hours,
    location: raw.location || '',
  };
};

// ═══════════════════════════════════════════
// API
// ═══════════════════════════════════════════
export async function fetchSettings(slug: string): Promise<HotelSettings | null> {
  try {
    const res = await fetch(`${API_URL}/portal/${slug}/settings`, {
      headers: { ...authHeaders() },
    });

    if (!res.ok) {
      console.warn(`[settings] fetchSettings: HTTP ${res.status}`);
      return null;
    }

    const data = await safeJson(res);
    if (!data.success || !data.settings) return null;

    return {
      ...DEFAULT_SETTINGS,
      ...data.settings,
      wifi: Array.isArray(data.settings.wifi) ? data.settings.wifi : [],
      social_media: {
        ...DEFAULT_SETTINGS.social_media,
        ...(data.settings.social_media || {}),
      },
      directions: {
        ...DEFAULT_SETTINGS.directions,
        ...(data.settings.directions || {}),
      },
      // ⭐ HAR BIR service uchun xavfsiz merge
      gym:     mergeServiceDetail(data.settings.gym,     DEFAULT_GYM),
      spa:     mergeServiceDetail(data.settings.spa,     DEFAULT_SPA),
      pool:    mergeServiceDetail(data.settings.pool,    DEFAULT_POOL),
      laundry: mergeServiceDetail(data.settings.laundry, DEFAULT_LAUNDRY),
      active_services: data.settings.active_services || DEFAULT_SETTINGS.active_services,
    };
  } catch (err) {
    console.error('[settings] fetchSettings error:', err);
    return null;
  }
}

export async function updateSettings(
  slug: string,
  partial: Partial<HotelSettings>
): Promise<{ success: boolean; error?: string; settings?: HotelSettings }> {
  try {
    const res = await fetch(`${API_URL}/portal/${slug}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(partial),
    });

    const data = await safeJson(res);
    return {
      success: data.success || false,
      error: data.error,
      settings: data.settings,
    };
  } catch (err: any) {
    console.error('[settings] updateSettings error:', err);
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export async function uploadCoverPhotos(
  slug: string,
  files: File[]
): Promise<CoverPhotosResponse> {
  try {
    if (files.length === 0) return { success: false, error: 'Rasm tanlanmagan' };
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));

    const res = await fetch(`${API_URL}/portal/${slug}/settings/cover-photos`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: fd,
    });

    return await safeJson(res);
  } catch (err: any) {
    console.error('[settings] uploadCoverPhotos error:', err);
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export async function deleteCoverPhoto(
  slug: string,
  idx: number
): Promise<CoverPhotosResponse> {
  try {
    const res = await fetch(
      `${API_URL}/portal/${slug}/settings/cover-photos/${idx}`,
      { method: 'DELETE', headers: { ...authHeaders() } }
    );
    return await safeJson(res);
  } catch (err: any) {
    console.error('[settings] deleteCoverPhoto error:', err);
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export async function uploadRecommendationImage(
  slug: string,
  file: File
): Promise<UploadImageResponse> {
  try {
    if (!file) return { success: false, error: 'Rasm tanlanmagan' };
    const fd = new FormData();
    fd.append('image', file);

    const res = await fetch(
      `${API_URL}/portal/${slug}/settings/recommendations/upload-image`,
      { method: 'POST', headers: { ...authHeaders() }, body: fd }
    );
    return await safeJson(res);
  } catch (err: any) {
    console.error('[settings] uploadRecommendationImage error:', err);
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export async function uploadServiceImage(
  slug: string,
  file: File
): Promise<UploadImageResponse> {
  try {
    if (!file) return { success: false, error: 'Rasm tanlanmagan' };
    const fd = new FormData();
    fd.append('image', file);

    const res = await fetch(
      `${API_URL}/portal/${slug}/settings/service-image`,
      { method: 'POST', headers: { ...authHeaders() }, body: fd }
    );
    return await safeJson(res);
  } catch (err: any) {
    console.error('[settings] uploadServiceImage error:', err);
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return true;
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return true;
  return /^[+\d\s\-()]{6,20}$/.test(phone.trim());
};