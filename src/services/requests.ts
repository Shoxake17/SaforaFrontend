// src/services/requests.ts
import { API_URL } from '@config/api';
import { tokenService } from './auth';

const authHeaders = (): Record<string, string> => {
  const token = tokenService.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeJson = async (res: Response): Promise<any> => {
  try { return await res.json(); }
  catch { return { success: false, error: `HTTP ${res.status}` }; }
};

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
export type RequestStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export type ServiceType =
  | 'yandex_taxi' | 'wake_up' | 'concierge'
  | 'spa' | 'pool' | 'gym' | 'laundry' | 'other';

export interface ServiceRequest {
  _id: string;
  hotel_slug: string;
  room_number: string;
  guest_name: string;
  service_type: ServiceType;
  status: RequestStatus;
  details: Record<string, any>;
  response_message?: string;
  approved_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface YandexTaxiDetails {
  pickup_location: string;
  dropoff_location: string;
  scheduled_at?: string;
  comments?: string;
}

// ═══════════════════════════════════════════
// API
// ═══════════════════════════════════════════

// Guest: create new request
export async function createGuestRequest(payload: {
  hotel_slug: string;
  room_number: string;
  guest_name?: string;
  service_type: ServiceType;
  details: Record<string, any>;
}): Promise<{ success: boolean; error?: string; request?: ServiceRequest }> {
  try {
    const res = await fetch(`${API_URL}/guest/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

// Manager: list requests
export async function listRequests(
  slug: string,
  status?: RequestStatus | 'all',
  limit = 100
): Promise<{
  success: boolean;
  total?: number;
  pending?: number;
  requests?: ServiceRequest[];
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(limit));

    const res = await fetch(
      `${API_URL}/portal/${slug}/requests?${params}`,
      { headers: { ...authHeaders() } }
    );
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

// Manager: approve request
export async function approveRequest(
  slug: string,
  requestId: string,
  message?: string
): Promise<{ success: boolean; error?: string; request?: ServiceRequest }> {
  try {
    const res = await fetch(
      `${API_URL}/portal/${slug}/requests/${requestId}/approve`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: message || '' }),
      }
    );
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}

// Manager: cancel request
export async function cancelRequest(
  slug: string,
  requestId: string
): Promise<{ success: boolean; error?: string; request?: ServiceRequest }> {
  try {
    const res = await fetch(
      `${API_URL}/portal/${slug}/requests/${requestId}/cancel`,
      { method: 'PATCH', headers: { ...authHeaders() } }
    );
    return await safeJson(res);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Tarmoq xatosi' };
  }
}