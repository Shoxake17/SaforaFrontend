// src/hooks/calls/useCallStorage.ts
import { useCallback } from 'react';
import { RECONNECT_TIMEOUT_MS } from '@config/callConfig';

interface BaseStoredCall {
  callId: string;
  startedAt: number;
}

export function useCallStorage<T extends BaseStoredCall>(storageKey: string) {
  const save = useCallback(
    (data: Omit<T, 'startedAt'>) => {
      try {
        const fullData = { ...data, startedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(fullData));
      } catch {
      }
    },
    [storageKey]
  );

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
    }
  }, [storageKey]);

  const get = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw) as T;

      if (Date.now() - data.startedAt > RECONNECT_TIMEOUT_MS) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return data;
    } catch {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      return null;
    }
  }, [storageKey]);

  return { save, remove, get };
}


export interface StoredGuestCall extends BaseStoredCall {
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
}

export interface StoredStaffCall extends BaseStoredCall {
}