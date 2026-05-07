// src/utils/imageUrl.ts
import { API_URL } from '../config/api';

export function imageUrl(p?: string | null): string {
  if (!p) return '';

  // Allaqachon to'liq URL (R2 yoki tashqi)
  if (/^https?:\/\//i.test(p)) {
    return p;
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  if (p.startsWith('/')) {
    return `${baseUrl}${p}`;
  }

  return `${baseUrl}/${p}`;
}