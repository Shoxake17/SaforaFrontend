// src/services/calls.ts
import { api } from './api';

export type CallStatus = 'ringing' | 'answered' | 'ended' | 'missed';
export type ReconnectInitiator = 'guest' | 'staff' | null;

export interface IncomingCall {
  id: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  createdAt: string;
  reconnectAttemptedBy?: ReconnectInitiator;
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface CallStatusData {
  success: boolean;
  id: string;
  status: CallStatus;
  offerSdp: string;
  answerSdp: string;
  iceGuest: ICECandidate[];
  iceStaff: ICECandidate[];
  answeredByName: string;
  roomNumber: string;
  guestName: string;
  originalAnsweredAt?: string | null;
  answeredAt?: string | null;
  reconnectAttemptedBy?: ReconnectInitiator;
}

export interface InitiateCallParams {
  hotelSlug: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  offerSdp: string;
}

export interface InitiateCallResult {
  success: boolean;
  callId: string;
  status: string;
}

export interface PollCallsResult {
  success: boolean;
  calls: IncomingCall[];
}

export interface AnswerCallResult {
  success: boolean;
  callId?: string;
  iceGuest?: ICECandidate[];
  offerSdp?: string;
  alreadyAnswered?: boolean;
  answeredBy?: string;
  originalAnsweredAt?: string | null;
}

export interface ReconnectResult {
  success: boolean;
  callId: string;
  status: string;
  originalAnsweredAt?: string | null;
}


export async function initiateCall(
  params: InitiateCallParams
): Promise<InitiateCallResult> {
  const res = await api.post<InitiateCallResult>('/calls/initiate', params, {
    skipAuth: true,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to initiate call');
  }
  return res.data;
}

export async function pollCalls(): Promise<PollCallsResult> {
  const res = await api.get<PollCallsResult>('/calls');
  if (!res.success || !res.data) {
    return { success: false, calls: [] };
  }
  return res.data;
}

export async function getCallStatus(callId: string): Promise<CallStatusData> {
  const res = await api.get<CallStatusData>(`/calls/${callId}`, {
    skipAuth: true,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to get call status');
  }
  return res.data;
}

export async function answerCall(
  callId: string,
  answerSdp: string
): Promise<AnswerCallResult> {
  const res = await api.post<AnswerCallResult>(`/calls/${callId}/answer`, {
    answerSdp,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to answer call');
  }
  return res.data;
}

export async function sendIceCandidates(
  callId: string,
  candidates: ICECandidate[],
  from: 'guest' | 'staff'
): Promise<void> {
  await api.post(
    `/calls/${callId}/ice`,
    { candidates, from },
    { skipAuth: from === 'guest' }
  );
}

export async function endCall(callId: string): Promise<void> {
  await api.post(`/calls/${callId}/end`, {}, { skipAuth: true });
}

export async function reconnectCall(
  callId: string,
  offerSdp: string
): Promise<ReconnectResult> {
  const res = await api.post<ReconnectResult>(
    `/calls/${callId}/reconnect`,
    { offerSdp },
    { skipAuth: true }
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to reconnect call');
  }
  return res.data;
}

export async function staffReconnectCall(
  callId: string
): Promise<ReconnectResult> {
  const res = await api.post<ReconnectResult>(
    `/calls/${callId}/staff-reconnect`,
    {}
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to staff reconnect');
  }
  return res.data;
}

// ═══════════════════════════════════════════════════════
// Bugungi qo'ng'iroqlar statistikasi (PROTECTED)
// ═══════════════════════════════════════════════════════

export interface CallStatsToday {
  success: boolean;
  total: number;
  answered: number;
  missed: number;
}

export async function getTodayCallStats(): Promise<CallStatsToday> {
  const res = await api.get<CallStatsToday>('/calls/stats/today');

  if (!res.success || !res.data) {
    return {
      success: false,
      total: 0,
      answered: 0,
      missed: 0,
    };
  }

  return res.data;
}

// ═══════════════════════════════════════════════════════
// CALL HISTORY (PROTECTED)
// ═══════════════════════════════════════════════════════

export interface CallHistoryItem {
  id: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  status: CallStatus;
  duration: number; 
  answeredByName: string;
  answeredAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface CallHistoryResult {
  success: boolean;
  total: number;
  calls: CallHistoryItem[];
}

export type CallHistoryFilter = 'all' | 'ended' | 'missed';

export async function getCallHistory(
  filter: CallHistoryFilter = 'all',
  limit: number = 50
): Promise<CallHistoryResult> {
  const params = new URLSearchParams({
    limit: String(limit),
    status: filter,
  });

  const res = await api.get<CallHistoryResult>(`/calls/history?${params}`);

  if (!res.success || !res.data) {
    return { success: false, total: 0, calls: [] };
  }

  return res.data;
}


// ═══════════════════════════════════════════════════════
// ⭐ YANGI — Manager → Mehmon initiate
// ═══════════════════════════════════════════════════════
export interface InitiateFromStaffParams {
  roomNumber: string;
  offerSdp: string;
}

export interface InitiateFromStaffResult {
  success: boolean;
  callId?: string;
  status?: string;
  guest?: { name: string; phone: string };
  error?: string;
  code?: string;
}

export async function initiateCallFromStaff(
  params: InitiateFromStaffParams
): Promise<InitiateFromStaffResult> {
  const res = await api.post<InitiateFromStaffResult>(
    '/calls/initiate-from-staff',
    params
  );
  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error || 'Failed to initiate call',
    };
  }
  return res.data;
}

// ═══════════════════════════════════════════════════════
// ⭐ YANGI — Mehmon javob beradi (Manager qo'ng'irog'iga)
// ═══════════════════════════════════════════════════════
export interface AnswerByGuestResult {
  success: boolean;
  callId?: string;
  iceStaff?: ICECandidate[];
  alreadyAnswered?: boolean;
  originalAnsweredAt?: string | null;
}

export async function answerCallByGuest(
  callId: string,
  answerSdp: string
): Promise<AnswerByGuestResult> {
  const res = await api.post<AnswerByGuestResult>(
    `/calls/${callId}/answer-by-guest`,
    { answerSdp },
    { skipAuth: true }
  );
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Failed to answer call');
  }
  return res.data;
}