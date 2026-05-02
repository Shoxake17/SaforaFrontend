// src/types/room.ts

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

export interface RoomType {
  id: string;
  hotel_id?: string;
  name: string;
  price_per_night: number;
  description?: string;
  capacity?: number;
  amenities?: string[];
  created_at?: string;
}

export interface Room {
  id: string;
  hotel_id?: string;
  number: string;
  floor?: number;
  status: RoomStatus;
  room_type?: RoomType | null;
  room_type_id?: string;
  notes?: string;
  created_at?: string;
}

/** Status config interface */
export interface RoomStatusInfo {
  label: string;
  color: string;
  bg: string;
}

/** Room status uchun ranglar va labellar */
export const ROOM_STATUS_CONFIG: Record<RoomStatus, RoomStatusInfo> = {
  available:   { label: 'Available',   color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  occupied:    { label: 'Occupied',    color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  dirty:       { label: 'Dirty',       color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  maintenance: { label: 'Maintenance', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
};