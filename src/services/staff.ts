// src/services/staff.ts
import { API_URL } from '@config/api';
import { tokenService } from './auth';

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
  password?: string;              // ixtiyoriy — bo'sh bo'lsa o'zgarmaydi
  profile_photo?: File | null;
}

// ═══════════════════════════════════════════════════════
// AUTH HEADERS
// ═══════════════════════════════════════════════════════

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = tokenService.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ═══════════════════════════════════════════════════════
// HELPER — Backend _id ni frontend id ga moslashish
// ═══════════════════════════════════════════════════════

const normalizeStaff = (s: any): StaffMember => ({
  ...s,
  id: s._id || s.id,
  joined_at: s.createdAt || s.joined_at,
});

// ═══════════════════════════════════════════════════════
// GET ALL STAFF — /api/:slug/staff
// ═══════════════════════════════════════════════════════

export const fetchStaff = async (hotelSlug: string) => {
  try {
    const res = await fetch(`${API_URL}/api/${hotelSlug}/staff`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        staff: [] as StaffMember[],
      };
    }

    const staff: StaffMember[] = (data.staff || []).map(normalizeStaff);

    return { success: true, staff };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      staff: [] as StaffMember[],
    };
  }
};

// ═══════════════════════════════════════════════════════
// GET ONE STAFF — /api/:slug/staff/:id
// ═══════════════════════════════════════════════════════

export const fetchStaffById = async (hotelSlug: string, id: string) => {
  try {
    const res = await fetch(`${API_URL}/api/${hotelSlug}/staff/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        staff: null as StaffMember | null,
      };
    }

    return {
      success: true,
      staff: normalizeStaff(data.staff),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      staff: null as StaffMember | null,
    };
  }
};

// ═══════════════════════════════════════════════════════
// POST STAFF (Add) — /api/:slug/staff
// ═══════════════════════════════════════════════════════

export const addStaff = async (payload: AddStaffPayload) => {
  try {
    const fd = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'hotel_slug') return; // URL'da boradi
      if (key === 'profile_photo' && value instanceof File) {
        fd.append('profile_photo', value);
      } else if (typeof value === 'string') {
        fd.append(key, value);
      }
    });

    const res = await fetch(`${API_URL}/api/${payload.hotel_slug}/staff`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(), // Content-Type'ni browser o'zi qo'yadi (multipart)
      body: fd,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return {
      success: true,
      staff: data.staff ? normalizeStaff(data.staff) : null,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ═══════════════════════════════════════════════════════
// PATCH STAFF (Edit) — /api/:slug/staff/:id
// ═══════════════════════════════════════════════════════

export const updateStaff = async (
  hotelSlug: string,
  id: string,
  payload: UpdateStaffPayload
) => {
  try {
    const fd = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'profile_photo' && value instanceof File) {
        fd.append('profile_photo', value);
      } else if (typeof value === 'string' && value !== '') {
        fd.append(key, value);
      }
    });

    const res = await fetch(`${API_URL}/api/${hotelSlug}/staff/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: fd,
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return {
      success: true,
      staff: data.staff ? normalizeStaff(data.staff) : null,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ═══════════════════════════════════════════════════════
// DELETE STAFF — /api/:slug/staff/:id
// ═══════════════════════════════════════════════════════

export const deleteStaff = async (hotelSlug: string, id: string) => {
  try {
    const res = await fetch(`${API_URL}/api/${hotelSlug}/staff/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};