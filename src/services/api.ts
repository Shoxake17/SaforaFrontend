// src/services/api.ts
import { tokenService } from './auth';
import { API_URL } from '@config/api';

const API = API_URL;

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface RequestOptions {
  /** Request body — JSON object or FormData */
  body?: any;
  /** Custom headers (override defaults) */
  headers?: Record<string, string>;
  /** Skip auth header (for public endpoints) */
  skipAuth?: boolean;
}

/* ─────────────────────────────────────────────
   Core fetch wrapper
───────────────────────────────────────────── */
const request = async <T = any>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> => {
  const { body, headers: customHeaders, skipAuth } = options;

  // Build headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  // Auth header (unless skipped)
  if (!skipAuth) {
    const token = tokenService.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Body — auto-detect JSON vs FormData
  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    // FormData — browser sets Content-Type with boundary
    requestBody = body;
  } else if (body !== undefined && body !== null) {
    // JSON
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: requestBody,
    });

    // Parse response
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `HTTP ${res.status}`,
        status: res.status,
      };
    }

    return {
      success: true,
      data: data as T,
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || 'Network error',
    };
  }
};

/* ─────────────────────────────────────────────
   Public API — clean methods
───────────────────────────────────────────── */
export const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),

  post: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),

  put: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),

  patch: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),

  delete: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};

export default api;