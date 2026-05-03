// src/services/staff.ts
import { api } from './api';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface StaffMember {
  _id?: string;
  id?: string | number;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  role_label: string;
  address?: string;
  birth_date?: string | null;
  profile_photo?: string;
  hotel?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  joined_at?: string;
}

export interface AddStaffPayload {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role_label: string;
  address?: string;
  birth_date?: string;
  hotel_slug: string;
  profile_photo?: File | null;
}

export interface UpdateStaffPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role_label?: string;
  address?: string;
  birth_date?: string;
  password?: string;
  profile_photo?: File | null;
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

const normalizeStaff = (s: any): StaffMember => ({
  ...s,
  id: s._id || s.id,
  joined_at: s.createdAt || s.joined_at,
});

const buildStaffFormData = (
  payload: AddStaffPayload | UpdateStaffPayload,
): FormData => {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'hotel_slug') return; // URL'da boradi
    if (key === 'profile_photo' && value instanceof File) {
      fd.append('profile_photo', value);
    } else if (typeof value === 'string' && value !== '') {
      fd.append(key, value);
    }
  });
  return fd;
};

// ═══════════════════════════════════════════════════════
// CRUD
// NOTE: Bu endpointlar /api/api/:slug/staff bo'ladi, chunki
// API_URL allaqachon /api bilan tugaydi. Backend tekshirib
// to'g'ri yo'lni aniqlang.
// ═══════════════════════════════════════════════════════

export const fetchStaff = async (hotelSlug: string) => {
  const res = await api.get(`/${hotelSlug}/staff`);
  if (!res.success) {
    return { success: false, error: res.error, staff: [] as StaffMember[] };
  }
  const staff: StaffMember[] = (res.data?.staff || []).map(normalizeStaff);
  return { success: true, staff };
};

export const fetchStaffById = async (hotelSlug: string, id: string) => {
  const res = await api.get(`/${hotelSlug}/staff/${id}`);
  if (!res.success) {
    return { success: false, error: res.error, staff: null as StaffMember | null };
  }
  return { success: true, staff: normalizeStaff(res.data?.staff) };
};

export const addStaff = async (payload: AddStaffPayload) => {
  const fd = buildStaffFormData(payload);
  const res = await api.post(`/${payload.hotel_slug}/staff`, fd);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    staff: res.data?.staff ? normalizeStaff(res.data.staff) : null,
  };
};

export const updateStaff = async (
  hotelSlug: string,
  id: string,
  payload: UpdateStaffPayload,
) => {
  const fd = buildStaffFormData(payload);
  const res = await api.patch(`/${hotelSlug}/staff/${id}`, fd);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    staff: res.data?.staff ? normalizeStaff(res.data.staff) : null,
  };
};

export const deleteStaff = async (hotelSlug: string, id: string) => {
  const res = await api.delete(`/${hotelSlug}/staff/${id}`);
  return { success: res.success, error: res.error };
};