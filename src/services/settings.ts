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

// ⭐ Universal Service Detail
export interface ServiceDetail {
  images: string[];
  description: string;
  open_time: string;
  close_time: string;
  is_24_hours: boolean;
  location: string;
}

// ⭐ LAUNDRY
export type LaundryCategory = 'men' | 'women' | 'children';

export interface LaundryItem {
  _id?: string;
  category: LaundryCategory;
  name: string;
  price: number;
}

export interface LaundryDetail extends ServiceDetail {
  items: LaundryItem[];
}

// ⭐⭐⭐ RESTAURANT
export interface RestaurantCategory {
  _id?: string;
  name: string;
  icon: string;        // emoji
  order: number;
}

export interface RestaurantItem {
  _id?: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  order: number;
}

export interface RestaurantDetail extends ServiceDetail {
  categories: RestaurantCategory[];
  items: RestaurantItem[];
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
  laundry: LaundryDetail;
  yandex_taxi: ServiceDetail;
  restaurant: RestaurantDetail;
  luggage_storage: ServiceDetail;   // ⭐⭐⭐ YANGI
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

// ═══════════════════════════════════════════
// Defaults
// ═══════════════════════════════════════════
export const DEFAULT_GYM: ServiceDetail = {
  images: [], description: '', open_time: '06:00', close_time: '23:00', is_24_hours: false, location: '',
};

export const DEFAULT_SPA: ServiceDetail = {
  images: [], description: '', open_time: '09:00', close_time: '21:00', is_24_hours: false, location: '',
};

export const DEFAULT_POOL: ServiceDetail = {
  images: [], description: '', open_time: '08:00', close_time: '22:00', is_24_hours: false, location: '',
};

export const DEFAULT_LAUNDRY: LaundryDetail = {
  images: [], description: '', open_time: '09:00', close_time: '20:00',
  is_24_hours: false, location: '', items: [],
};

export const DEFAULT_YANDEX_TAXI: ServiceDetail = {
  images: [], description: '', open_time: '00:00', close_time: '23:59', is_24_hours: true, location: '',
};

// ⭐⭐⭐ RESTAURANT default
export const DEFAULT_RESTAURANT: RestaurantDetail = {
  images: [],
  description: '',
  open_time: '08:00',
  close_time: '23:00',
  is_24_hours: false,
  location: '',
  categories: [],
  items: [],
};

// ⭐⭐⭐ LUGGAGE STORAGE default — YANGI
export const DEFAULT_LUGGAGE_STORAGE: ServiceDetail = {
  images: [],
  description: '',
  open_time: '00:00',
  close_time: '23:59',
  is_24_hours: true,
  location: '',
};

// ⭐⭐⭐ Default category templates (yangi hotel uchun)
export const RESTAURANT_CATEGORY_TEMPLATES = [
  { name: 'Breakfast',   icon: '🍳', order: 1 },
  { name: 'Starters',    icon: '🥗', order: 2 },
  { name: 'Main Course', icon: '🍽️', order: 3 },
  { name: 'Desserts',    icon: '🍰', order: 4 },
  { name: 'Beverages',   icon: '🥤', order: 5 },
  { name: 'Hot Drinks',  icon: '☕', order: 6 },
  { name: 'Water',       icon: '💧', order: 7 },
  { name: 'Snacks',      icon: '🍿', order: 8 },
];

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
  gym:             { ...DEFAULT_GYM },
  spa:             { ...DEFAULT_SPA },
  pool:            { ...DEFAULT_POOL },
  laundry:         { ...DEFAULT_LAUNDRY, items: [] },
  yandex_taxi:     { ...DEFAULT_YANDEX_TAXI },
  restaurant:      { ...DEFAULT_RESTAURANT, categories: [], items: [] },
  luggage_storage: { ...DEFAULT_LUGGAGE_STORAGE },   // ⭐⭐⭐ YANGI
};

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
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

const mergeLaundryDetail = (raw: any): LaundryDetail => {
  if (!raw) return { ...DEFAULT_LAUNDRY, items: [] };
  const base = mergeServiceDetail(raw, DEFAULT_LAUNDRY);
  const items: LaundryItem[] = Array.isArray(raw.items)
    ? raw.items
        .filter((it: any) => it && typeof it.name === 'string')
        .map((it: any) => ({
          _id: it._id ? String(it._id) : undefined,
          category: ['men', 'women', 'children'].includes(it.category) ? it.category : 'men',
          name: String(it.name).trim().slice(0, 100),
          price: Math.max(0, Number(it.price) || 0),
        }))
    : [];
  return { ...base, items };
};

// ⭐⭐⭐ RESTAURANT merge
const mergeRestaurantDetail = (raw: any): RestaurantDetail => {
  if (!raw) return { ...DEFAULT_RESTAURANT, categories: [], items: [] };
  const base = mergeServiceDetail(raw, DEFAULT_RESTAURANT);

  const categories: RestaurantCategory[] = Array.isArray(raw.categories)
    ? raw.categories
        .filter((c: any) => c && typeof c.name === 'string')
        .map((c: any) => ({
          _id: c._id ? String(c._id) : undefined,
          name: String(c.name).trim().slice(0, 50),
          icon: c.icon || '🍽️',
          order: Number(c.order) || 0,
        }))
        .sort((a: RestaurantCategory, b: RestaurantCategory) => a.order - b.order)
    : [];

  const items: RestaurantItem[] = Array.isArray(raw.items)
    ? raw.items
        .filter((it: any) => it && typeof it.name === 'string' && it.category_id)
        .map((it: any) => ({
          _id: it._id ? String(it._id) : undefined,
          category_id: String(it.category_id),
          name: String(it.name).trim().slice(0, 100),
          price: Math.max(0, Number(it.price) || 0),
          description: it.description ? String(it.description).slice(0, 500) : '',
          image: it.image || '',
          available: it.available !== false,
          order: Number(it.order) || 0,
        }))
        .sort((a: RestaurantItem, b: RestaurantItem) => a.order - b.order)
    : [];

  return { ...base, categories, items };
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
      gym:             mergeServiceDetail(data.settings.gym,             DEFAULT_GYM),
      spa:             mergeServiceDetail(data.settings.spa,             DEFAULT_SPA),
      pool:            mergeServiceDetail(data.settings.pool,            DEFAULT_POOL),
      laundry:         mergeLaundryDetail(data.settings.laundry),
      yandex_taxi:     mergeServiceDetail(data.settings.yandex_taxi,     DEFAULT_YANDEX_TAXI),
      restaurant:      mergeRestaurantDetail(data.settings.restaurant),
      luggage_storage: mergeServiceDetail(data.settings.luggage_storage, DEFAULT_LUGGAGE_STORAGE),   // ⭐⭐⭐ YANGI
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

// ⭐ Restaurant item rasmi shu funksiya orqali yuklanadi
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