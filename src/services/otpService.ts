// src/services/otpService.ts
import { API_URL } from '@config/api';

interface SendOtpResult {
  success: boolean;
  message?: string;
  expiresInMin?: number;
  error?: string;
  retryAfter?: number;
}

interface VerifyOtpResult {
  success: boolean;
  message?: string;
  email?: string;
  verified?: boolean;
  error?: string;
  attemptsLeft?: number;
}

/**
 * OTP yuborish
 */
export async function sendOtp(email: string): Promise<SendOtpResult> {
  try {
    const res = await fetch(`${API_URL}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'register' }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Tarmoq xatosi',
    };
  }
}

/**
 * OTP tekshirish
 */
export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
  try {
    const res = await fetch(`${API_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Tarmoq xatosi',
    };
  }
}