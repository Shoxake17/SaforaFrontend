// src/hooks/calls/index.ts

// Pure WebRTC infrastructure
export { useWebRTCPeer } from './useWebRTCPeer';
export { useIceCandidateBatch } from './useIceCandidateBatch';
export { useCallStorage } from './useCallStorage';
export type { StoredGuestCall, StoredStaffCall } from './useCallStorage';

// Call hooks (high-level)
export { useGuestCall } from './useGuestCall';
export type { GuestCallStatus } from './useGuestCall';

export { useStaffCall } from './useStaffCall';
export type { StaffCallStatus } from './useStaffCall';

export { useIncomingCalls, useRingtone } from './useIncomingCalls';