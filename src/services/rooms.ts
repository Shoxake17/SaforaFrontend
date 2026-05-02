// src/services/rooms.ts
import { tokenService } from './auth';
import type { Room, RoomType } from '@apptypes/room';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─────────────────────────────────────────────
   Headers — JSON va FormData uchun alohida
───────────────────────────────────────────── */
const jsonHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tokenService.get()}`,
});

const formHeaders = (): HeadersInit => ({
  // Content-Type qo'ymaymiz — browser FormData uchun avtomatik (boundary bilan) qo'yadi
  Authorization: `Bearer ${tokenService.get()}`,
});

/* ─────────────────────────────────────────────
   Normalizers — backend ma'lumotini frontend type'ga o'tkazish
───────────────────────────────────────────── */
const normalizeRoom = (r: any): Room => ({
  id:           r.id || r._id,
  hotel_id:     r.hotel_id,
  number:       r.number || r.room_number || '',
  floor:        r.floor,
  status:       r.status || 'available',
  room_type:    r.room_type || null,
  room_type_id: r.room_type_id || r.room_type?.id || r.room_type?._id,
  notes:        r.notes,
  created_at:   r.created_at || r.createdAt,
});

const normalizeRoomType = (rt: any): RoomType => ({
  id:              rt.id || rt._id,
  hotel_id:        rt.hotel_id,
  name:            rt.name || '',
  price_per_night: Number(rt.price_per_night) || 0,
  description:     rt.description || '',
  capacity:        rt.capacity,
  amenities:       rt.amenities || [],
  created_at:      rt.created_at || rt.createdAt,
});

/* ─────────────────────────────────────────────
   Response types
───────────────────────────────────────────── */
interface RoomsListResponse {
  success: boolean;
  rooms: Room[];
  error?: string;
}

interface RoomResponse {
  success: boolean;
  room?: Room;
  error?: string;
}

interface RoomTypesListResponse {
  success: boolean;
  roomTypes: RoomType[];
  error?: string;
}

interface RoomTypeResponse {
  success: boolean;
  roomType?: RoomType;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

/* ═══════════════════════════════════════════════════════
   ROOMS — CRUD
═══════════════════════════════════════════════════════ */

/**
 * Hotel ichidagi barcha xonalarni olish
 */
export const fetchRooms = async (
  hotelSlug: string,
): Promise<RoomsListResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/rooms`, {
      method: 'GET',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        rooms: [],
        error: err.message || 'Failed to fetch rooms',
      };
    }

    const data = await res.json();
    const rooms = Array.isArray(data) ? data : data.rooms || [];
    return { success: true, rooms: rooms.map(normalizeRoom) };
  } catch (err) {
    return {
      success: false,
      rooms: [],
      error: (err as Error).message,
    };
  }
};

/**
 * Bitta xonani olish
 */
export const fetchRoomById = async (
  hotelSlug: string,
  roomId: string,
): Promise<RoomResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/rooms/${roomId}`, {
      method: 'GET',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to fetch room',
      };
    }

    const data = await res.json();
    return {
      success: true,
      room: normalizeRoom(data.room || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Yangi xona yaratish (FormData bilan — fayl yuklash uchun)
 */
export const addRoom = async (
  hotelSlug: string,
  formData: FormData,
): Promise<RoomResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/rooms`, {
      method: 'POST',
      headers: formHeaders(),
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to create room',
      };
    }

    const data = await res.json();
    return {
      success: true,
      room: normalizeRoom(data.room || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Xonani yangilash (FormData bilan — fayl yuklash uchun)
 */
export const updateRoom = async (
  hotelSlug: string,
  roomId: string,
  formData: FormData,
): Promise<RoomResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/rooms/${roomId}`, {
      method: 'PUT',
      headers: formHeaders(),
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to update room',
      };
    }

    const data = await res.json();
    return {
      success: true,
      room: normalizeRoom(data.room || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Xonani o'chirish
 */
export const deleteRoom = async (
  hotelSlug: string,
  roomId: string,
): Promise<DeleteResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to delete room',
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/* ═══════════════════════════════════════════════════════
   ROOM TYPES — CRUD
═══════════════════════════════════════════════════════ */

/**
 * Hotel ichidagi barcha room type'larni olish
 */
export const fetchRoomTypes = async (
  hotelSlug: string,
): Promise<RoomTypesListResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/room-types`, {
      method: 'GET',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        roomTypes: [],
        error: err.message || 'Failed to fetch room types',
      };
    }

    const data = await res.json();
    const types = Array.isArray(data)
      ? data
      : data.roomTypes || data.room_types || [];

    return {
      success: true,
      roomTypes: types.map(normalizeRoomType),
    };
  } catch (err) {
    return {
      success: false,
      roomTypes: [],
      error: (err as Error).message,
    };
  }
};

/**
 * Bitta room type olish
 */
export const fetchRoomTypeById = async (
  hotelSlug: string,
  typeId: string,
): Promise<RoomTypeResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/room-types/${typeId}`, {
      method: 'GET',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to fetch room type',
      };
    }

    const data = await res.json();
    return {
      success: true,
      roomType: normalizeRoomType(data.roomType || data.room_type || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Yangi room type yaratish
 */
export const addRoomType = async (
  hotelSlug: string,
  payload: Partial<RoomType>,
): Promise<RoomTypeResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/room-types`, {
      method: 'POST',
      headers: jsonHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to create room type',
      };
    }

    const data = await res.json();
    return {
      success: true,
      roomType: normalizeRoomType(data.roomType || data.room_type || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Room type yangilash
 */
export const updateRoomType = async (
  hotelSlug: string,
  typeId: string,
  payload: Partial<RoomType>,
): Promise<RoomTypeResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/room-types/${typeId}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to update room type',
      };
    }

    const data = await res.json();
    return {
      success: true,
      roomType: normalizeRoomType(data.roomType || data.room_type || data),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};

/**
 * Room type o'chirish
 */
export const deleteRoomType = async (
  hotelSlug: string,
  typeId: string,
): Promise<DeleteResponse> => {
  try {
    const res = await fetch(`${API}/hotels/${hotelSlug}/room-types/${typeId}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.message || 'Failed to delete room type',
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
};