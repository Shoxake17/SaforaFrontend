// src/config/api.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API endpoint'lar — kelajakda kengaytirish uchun
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  CHECK_AVAILABILITY: '/auth/check-availability',

  // Portal
  PORTAL_LOGIN: '/portal',
  PORTAL_HOTEL: (slug: string) => `/portal/${slug}`,

  // Hotel API
  HOTEL_BY_ID: (id: string) => `/api/hotels/${id}`,

  // Google OAuth
  GOOGLE_LOGIN: '/auth/google/login',
  GOOGLE_SUCCESS: '/auth/google/success',

  // Uploads
  UPLOAD: (path: string) => `/uploads/${path}`,
} as const;

// To'liq URL yaratish helper
export const apiUrl = (endpoint: string): string => `${API_URL}${endpoint}`;