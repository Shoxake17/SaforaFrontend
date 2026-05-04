// src/services/guestToken.ts
const GUEST_TOKEN_KEY = 'safora_guest_token';

export const guestTokenService = {
  get(): string | null {
    try {
      return localStorage.getItem(GUEST_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    try {
      localStorage.setItem(GUEST_TOKEN_KEY, token);
    } catch {
      // silent
    }
  },

  remove(): void {
    try {
      localStorage.removeItem(GUEST_TOKEN_KEY);
    } catch {
      // silent
    }
  },

  exists(): boolean {
    try {
      return !!localStorage.getItem(GUEST_TOKEN_KEY);
    } catch {
      return false;
    }
  },
};