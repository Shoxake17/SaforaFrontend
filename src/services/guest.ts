// src/services/guest.ts
import { API_URL } from '@config/api';
import type { FetchGuestSessionResult } from '@apptypes/guest';

const safeJson = async (res: Response): Promise<any> => {
  try {
    return await res.json();
  } catch {
    return { success: false, error: `HTTP ${res.status}` };
  }
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('safora_guest_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ═══════════════════════════════════════════════════════
// Fetch Guest Session — hotel + room + settings
// ═══════════════════════════════════════════════════════
export async function fetchGuestSession(
  hotelSlug: string,
  roomNumber: string
): Promise<FetchGuestSessionResult> {
  try {
    const res = await fetch(
      `${API_URL}/guest/${hotelSlug}/${roomNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      }
    );

    const data = await safeJson(res);

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Hotel or Room not found',
      };
    }

    return {
      success: true,
      hotel: data.hotel,
      room: data.room,
      settings: data.settings,
    };
  } catch (err: any) {
    console.error('[guest] fetchGuestSession error:', err);
    return {
      success: false,
      error: err?.message || 'Network error',
    };
  }
}