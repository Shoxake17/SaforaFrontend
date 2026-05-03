// src/services/calls.ts
import { api } from './api';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
export interface IncomingCall {
  id: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  createdAt: string;
  reconnectAttemptedBy?: 'guest' | 'staff' | null; 
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface CallStatusData {
  success: boolean;
  id: string;
  status: 'ringing' | 'answered' | 'ended' | 'missed';
  offerSdp: string;
  answerSdp: string;
  iceGuest: ICECandidate[];
  iceStaff: ICECandidate[];
  answeredByName: string;
  roomNumber: string;
  guestName: string;
  originalAnsweredAt?: string | null; // ✅ Timer uchun
  answeredAt?: string | null;
  reconnectAttemptedBy?: 'guest' | 'staff' | null; // ✅ AUTO-ACCEPT uchun
}

interface PollCallsData {
  success: boolean;
  calls: IncomingCall[];
}

interface InitiateCallData {
  success: boolean;
  callId: string;
  status: string;
}

interface AnswerCallData {
  success: boolean;
  callId?: string;
  iceGuest?: ICECandidate[];
  offerSdp?: string;
  alreadyAnswered?: boolean;
  answeredBy?: string;
}

// ✅ YANGI
interface ReconnectCallData {
  success: boolean;
  callId: string;
  status: string;
}

// ═══════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════

export const initiateCall = async (data: {
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  offerSdp: string;
}): Promise<InitiateCallData> => {
  const res = await api.post<InitiateCallData>('/calls/initiate', data, {
    skipAuth: true,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to initiate call');
  }
  return res.data;
};

export const pollCalls = async (): Promise<PollCallsData> => {
  const res = await api.get<PollCallsData>('/calls');
  if (!res.success || !res.data) {
    return { success: false, calls: [] };
  }
  return res.data;
};

export const getCallStatus = async (callId: string): Promise<CallStatusData> => {
  const res = await api.get<CallStatusData>(`/calls/${callId}`, {
    skipAuth: true,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to get call status');
  }
  return res.data;
};

export const answerCall = async (
  callId: string,
  answerSdp: string
): Promise<AnswerCallData> => {
  const res = await api.post<AnswerCallData>(`/calls/${callId}/answer`, {
    answerSdp,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to answer call');
  }
  return res.data;
};

export const sendIceCandidates = async (
  callId: string,
  candidates: ICECandidate[],
  from: 'guest' | 'staff'
): Promise<void> => {
  await api.post(
    `/calls/${callId}/ice`,
    { candidates, from },
    { skipAuth: from === 'guest' }
  );
};

export const endCall = async (callId: string): Promise<void> => {
  await api.post(`/calls/${callId}/end`, {}, { skipAuth: true });
};

// ✅ YANGI — Refresh'dan keyin qayta ulanish
export const reconnectCall = async (
  callId: string,
  offerSdp: string
): Promise<ReconnectCallData> => {
  const res = await api.post<ReconnectCallData>(
    `/calls/${callId}/reconnect`,
    { offerSdp },
    { skipAuth: true }
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to reconnect call');
  }
  return res.data;
};

/** Manager refresh'dan keyin qayta ulanish (PROTECTED) */
export const staffReconnectCall = async (
  callId: string
): Promise<{ success: boolean; callId: string; status: string }> => {
  const res = await api.post<{
    success: boolean;
    callId: string;
    status: string;
  }>(`/calls/${callId}/staff-reconnect`, {});
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to staff reconnect');
  }
  return res.data;
};