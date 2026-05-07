// src/services/hotelsPublic.ts
import { API_URL } from '../config/api';

export interface PublicHotel {
  _id: string;
  slug: string;
  name: string;
  logo?: string;
  city?: string;
  country?: string;
  address?: string;
}

export async function fetchPublicHotels(): Promise<PublicHotel[]> {
  try {
    const res = await fetch(`${API_URL}/hotels/public`);
    if (!res.ok) {
      console.error('[fetchPublicHotels] HTTP error:', res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.hotels) ? data.hotels : [];
  } catch (err) {
    console.error('[fetchPublicHotels] error:', err);
    return [];
  }
}