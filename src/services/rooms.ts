// src/services/rooms.ts
import { api } from './api';
import type { Room, RoomType } from '@apptypes/room';

/* ─────────────────────────────────────────────
   Normalizers — backend → frontend type
───────────────────────────────────────────── */
const normalizeRoom = (r: any): Room => ({
  id: r.id || r._id,
  hotel_id: r.hotel_id,
  number: r.number || r.room_number || '',
  floor: r.floor,
  status: r.status || 'available',
  room_type: r.room_type || null,
  room_type_id: r.room_type_id || r.room_type?.id || r.room_type?._id,
  notes: r.notes,
  created_at: r.created_at || r.createdAt,
});

const normalizeRoomType = (rt: any): RoomType => ({
  id: rt.id || rt._id,
  hotel_id: rt.hotel_id,
  name: rt.name || '',
  price_per_night: Number(rt.price_per_night) || 0,
  description: rt.description || '',
  capacity: rt.capacity,
  amenities: rt.amenities || [],
  created_at: rt.created_at || rt.createdAt,
});

/* ═══════════════════════════════════════════════════════
   ROOMS — CRUD
═══════════════════════════════════════════════════════ */

export const fetchRooms = async (hotelSlug: string) => {
  const res = await api.get(`/hotels/${hotelSlug}/rooms`);
  if (!res.success) {
    return { success: false, rooms: [] as Room[], error: res.error };
  }
  const rooms = Array.isArray(res.data) ? res.data : res.data?.rooms || [];
  return { success: true, rooms: rooms.map(normalizeRoom) };
};

export const fetchRoomById = async (hotelSlug: string, roomId: string) => {
  const res = await api.get(`/hotels/${hotelSlug}/rooms/${roomId}`);
  if (!res.success) {
    return { success: false, error: res.error, room: undefined };
  }
  return { success: true, room: normalizeRoom(res.data?.room || res.data) };
};

export const addRoom = async (hotelSlug: string, formData: FormData) => {
  const res = await api.post(`/hotels/${hotelSlug}/rooms`, formData);
  if (!res.success) {
    return { success: false, error: res.error, room: undefined };
  }
  return { success: true, room: normalizeRoom(res.data?.room || res.data) };
};

export const updateRoom = async (
  hotelSlug: string,
  roomId: string,
  formData: FormData,
) => {
  const res = await api.put(`/hotels/${hotelSlug}/rooms/${roomId}`, formData);
  if (!res.success) {
    return { success: false, error: res.error, room: undefined };
  }
  return { success: true, room: normalizeRoom(res.data?.room || res.data) };
};

export const deleteRoom = async (hotelSlug: string, roomId: string) => {
  const res = await api.delete(`/hotels/${hotelSlug}/rooms/${roomId}`);
  return { success: res.success, error: res.error };
};

/* ═══════════════════════════════════════════════════════
   ROOM TYPES — CRUD
═══════════════════════════════════════════════════════ */

export const fetchRoomTypes = async (hotelSlug: string) => {
  const res = await api.get(`/hotels/${hotelSlug}/room-types`);
  if (!res.success) {
    return { success: false, roomTypes: [] as RoomType[], error: res.error };
  }
  const types = Array.isArray(res.data)
    ? res.data
    : res.data?.roomTypes || res.data?.room_types || [];
  return { success: true, roomTypes: types.map(normalizeRoomType) };
};

export const fetchRoomTypeById = async (hotelSlug: string, typeId: string) => {
  const res = await api.get(`/hotels/${hotelSlug}/room-types/${typeId}`);
  if (!res.success) {
    return { success: false, error: res.error, roomType: undefined };
  }
  return {
    success: true,
    roomType: normalizeRoomType(res.data?.roomType || res.data?.room_type || res.data),
  };
};

export const addRoomType = async (
  hotelSlug: string,
  payload: Partial<RoomType>,
) => {
  const res = await api.post(`/hotels/${hotelSlug}/room-types`, payload);
  if (!res.success) {
    return { success: false, error: res.error, roomType: undefined };
  }
  return {
    success: true,
    roomType: normalizeRoomType(res.data?.roomType || res.data?.room_type || res.data),
  };
};

export const updateRoomType = async (
  hotelSlug: string,
  typeId: string,
  payload: Partial<RoomType>,
) => {
  const res = await api.put(`/hotels/${hotelSlug}/room-types/${typeId}`, payload);
  if (!res.success) {
    return { success: false, error: res.error, roomType: undefined };
  }
  return {
    success: true,
    roomType: normalizeRoomType(res.data?.roomType || res.data?.room_type || res.data),
  };
};

export const deleteRoomType = async (hotelSlug: string, typeId: string) => {
  const res = await api.delete(`/hotels/${hotelSlug}/room-types/${typeId}`);
  return { success: res.success, error: res.error };
};