// src/config/callConfig.ts




export const GUEST_POLL_INTERVAL_MS = 2000;

export const MANAGER_POLL_INTERVAL_MS = 3000;

export const STAFF_STATUS_POLL_MS = 2000;

export const ICE_FLUSH_DELAY_MS = 500;

export const DISCONNECT_GRACE_MS = 15_000;

export const RECONNECT_TIMEOUT_MS = 60_000;

export const STORAGE_KEYS = {
  GUEST_CALL: 'safora_active_call',
  STAFF_CALL: 'safora_staff_active_call',
} as const;

export const ENDED_CLEANUP_DELAY_MS = 1000;
export const HANGUP_CLEANUP_DELAY_MS = 300;
export const FAILED_CLEANUP_DELAY_MS = 2000;