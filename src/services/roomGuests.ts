// src/services/roomGuests.ts
import { api } from './api';

export interface RoomGuest {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  language: string;
  isOnline: boolean;
  lastSeenAt: string;
  minutesAgo: number;
  checkInDate?: string;
  checkOutDate?: string;
  hasFcmTokens: boolean;
}

export interface RoomGuestsResult {
  success: boolean;
  room?: { number: string; floor?: string | number; type?: string };
  total?: number;
  guests?: RoomGuest[];
  error?: string;
}

export async function fetchRoomGuests(
  hotelSlug: string,
  roomNumber: string
): Promise<RoomGuestsResult> {
  const res = await api.get(
    `/hotels/${hotelSlug}/rooms/${encodeURIComponent(roomNumber)}/guests`
  );

  if (!res.success) {
    return { success: false, error: res.error };
  }

  return {
    success: true,
    room: res.data?.room,
    total: res.data?.total || 0,
    guests: res.data?.guests || [],
  };
}