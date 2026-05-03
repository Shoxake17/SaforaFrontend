// src/services/guest.ts
import { api } from './api';

interface FetchSessionResponse {
  success: boolean;
  hotel?: any;
  room?: any;
  settings?: any;
  error?: string;
}

interface RegisterResponse {
  success: boolean;
  guest_token?: string;
  error?: string;
}

/**
 * Get hotel + room info by slug + room number (public, no auth)
 */
export const fetchGuestSession = async (
  slug: string,
  roomNumber: string,
): Promise<FetchSessionResponse> => {
  const res = await api.get(`/guest/${slug}/${roomNumber}`, { skipAuth: true });
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    hotel: res.data?.hotel,
    room: res.data?.room,
    settings: res.data?.settings || {},
  };
};

/**
 * Register a guest (creates a session)
 */
export const registerGuest = async (payload: {
  hotel_slug: string;
  room_number: string;
  name: string;
  phone: string;
  email?: string;
  language?: string;
}): Promise<RegisterResponse> => {
  const res = await api.post('/guest/register', payload, { skipAuth: true });
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return { success: true, guest_token: res.data?.guest_token };
};