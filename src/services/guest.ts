// src/services/guest.ts

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  try {
    const res = await fetch(`${API}/guest/${slug}/${roomNumber}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Hotel or room not found' };
    }

    const data = await res.json();
    return {
      success: true,
      hotel: data.hotel,
      room: data.room,
      settings: data.settings || {},
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
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
  try {
    const res = await fetch(`${API}/guest/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Registration failed' };
    }

    const data = await res.json();
    return { success: true, guest_token: data.guest_token };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
};