// src/components/IncomingCall/IncomingCallOverlay.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  ShieldCheck,  
  Lock,
  Mic,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { useIncomingCalls, useRingtone } from "@hooks/calls/useIncomingCalls";
import { useStaffCall } from '@hooks/calls/useStaffCall';
import { endCall as endCallApi, getCallStatus } from '@services/calls';
import type { IncomingCall } from '@services/calls';
import { formatCallDuration, elapsedSecondsFrom } from '@utils/callTimer';
import './IncomingCallOverlay.css';

type CallScreen = 'ringing' | 'active' | 'failed';

const IncomingCallOverlay: React.FC = () => {
  const { incomingCall, dismissCall } = useIncomingCalls();
  const [screen, setScreen] = useState<CallScreen>('ringing');
  const [timerSec, setTimerSec] = useState<number>(0);
  const [activeCallInfo, setActiveCallInfo] = useState<IncomingCall | null>(
    null
  );

  // Timer uchun original boshlanish vaqti
  const [originalAnsweredAt, setOriginalAnsweredAt] = useState<number | null>(
    null
  );

  const acceptClickedRef = useRef<boolean>(false);
  const autoAcceptedRef = useRef<string | null>(null);

  const {
    status: staffStatus,
    errorMessage,
    acceptCall,
    hangUp,
    pendingReconnectCallId,
  } = useStaffCall({
    onEnded: () => {
      const callIdToEnd = activeCallInfo?.id || incomingCall?.id;
      if (callIdToEnd) {
        dismissCall(callIdToEnd);
      }
      setScreen('ringing');
      setTimerSec(0);
      setOriginalAnsweredAt(null);
      setActiveCallInfo(null);
      acceptClickedRef.current = false;
      autoAcceptedRef.current = null;
    },
  });

  useRingtone(
    incomingCall !== null &&
      screen === 'ringing' &&
      !activeCallInfo &&
      !pendingReconnectCallId
  );

  // ═════ Body scroll lock ═════
  useEffect(() => {
    if (incomingCall || activeCallInfo || staffStatus === 'reconnecting') {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [incomingCall, activeCallInfo, staffStatus]);

  // ═════ Timer — originalAnsweredAt'dan ═════
  useEffect(() => {
    if (staffStatus !== 'connected' || !originalAnsweredAt) return;

    const updateTimer = () => {
      setTimerSec(elapsedSecondsFrom(originalAnsweredAt));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [staffStatus, originalAnsweredAt]);

  // ═════ Yangi call kelganda reset ═════
  useEffect(() => {
    if (incomingCall && !activeCallInfo) {
      setScreen('ringing');
      acceptClickedRef.current = false;
    }
  }, [incomingCall?.id, activeCallInfo]);

  // ═════ staffStatus failed ═════
  useEffect(() => {
    if (staffStatus === 'failed') {
      setScreen('failed');
    }
  }, [staffStatus]);

  // ═════ AUTO-ACCEPT: Manager refresh + Mehmon refresh ═════
  useEffect(() => {
    if (!incomingCall) return;
    if (acceptClickedRef.current) return;

    const isManagerReconnect =
      pendingReconnectCallId && incomingCall.id === pendingReconnectCallId;
    const isGuestReconnect = incomingCall.reconnectAttemptedBy === 'guest';

    // Unique key — id + reason (mehmon refresh paytida id o'zgarmaydi)
    const autoAcceptKey = `${incomingCall.id}:${
      incomingCall.reconnectAttemptedBy || 'new'
    }`;

    if (autoAcceptedRef.current === autoAcceptKey) return;

    if (isManagerReconnect || isGuestReconnect) {
      console.log(
        '[IncomingCallOverlay] Auto-accepting reconnect call:',
        incomingCall.id,
        '| reason:',
        isManagerReconnect ? 'manager-reconnect' : 'guest-reconnect'
      );
      autoAcceptedRef.current = autoAcceptKey;

      // Mehmon reconnect — accept'ni qaytarish (yangi peer kerak)
      if (isGuestReconnect) {
        acceptClickedRef.current = false;
      }

      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    incomingCall?.id,
    incomingCall?.reconnectAttemptedBy,
    pendingReconnectCallId,
  ]);

  // ═════ Connected — backend'dan originalAnsweredAt olish ═════
  useEffect(() => {
    if (staffStatus !== 'connected' || !activeCallInfo) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await getCallStatus(activeCallInfo.id);
        if (cancelled) return;

        const startTime = data.originalAnsweredAt || data.answeredAt;
        if (startTime) {
          setOriginalAnsweredAt(new Date(startTime).getTime());
        }
      } catch (err) {
        console.warn(
          '[IncomingCallOverlay] Failed to fetch originalAnsweredAt:',
          err
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [staffStatus, activeCallInfo?.id]);

  // ═════ Handlers ═════
  const handleAccept = async () => {
    if (acceptClickedRef.current) {
      console.warn('[IncomingCallOverlay] accept already clicked');
      return;
    }
    if (!incomingCall) return;

    acceptClickedRef.current = true;
    setActiveCallInfo(incomingCall);
    setScreen('active');

    await acceptCall(incomingCall.id);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    const callIdToEnd = incomingCall.id;
    dismissCall(callIdToEnd);
    setScreen('ringing');
    setActiveCallInfo(null);
    setOriginalAnsweredAt(null);

    try {
      await endCallApi(callIdToEnd);
    } catch (err) {
      console.warn('[IncomingCallOverlay] decline error:', err);
    }
  };

  const handleEnd = () => {
    hangUp();
  };

  const displayCall = activeCallInfo || incomingCall;
  const showReconnectingUI =
    staffStatus === 'reconnecting' && !displayCall && pendingReconnectCallId;

  if (!displayCall && !showReconnectingUI) return null;

  return (
    <div className="ico-overlay">
      {/* RECONNECTING */}
      {showReconnectingUI && (
        <div className="ico-screen">
          <div
            className="ico-top-label"
            style={{
              background: 'rgba(251, 191, 36, 0.15)',
              borderColor: 'rgba(251, 191, 36, 0.3)',
            }}
          >
            <RotateCw size={12} strokeWidth={2.5} className="ico-spin" />
            <span>RECONNECTING TO CALL</span>
          </div>

          <div
            className="ico-active-circle"
            style={{
              background: 'linear-gradient(145deg, #f59e0b, #d97706)',
            }}
          >
            <RotateCw size={48} strokeWidth={2.4} className="ico-spin" />
          </div>

          <div className="ico-caller-info">
            <div className="ico-room-label">Reconnecting…</div>
            <div className="ico-guest-name">
              Re-establishing connection with guest
            </div>
            <div className="ico-call-status">
              <span className="ico-dot" />
              Please wait
            </div>
          </div>
        </div>
      )}

      {/* RINGING */}
      {displayCall && screen === 'ringing' && !showReconnectingUI && (
        <div className="ico-screen">
          <div className="ico-top-label">
            <ShieldCheck size={12} strokeWidth={2.5} />
            <span>SAFORA SECURE CALL</span>
          </div>

          <div className="ico-ring-wrap">
            <div className="ico-ring ico-ring-1" />
            <div className="ico-ring ico-ring-2" />
            <div className="ico-ring ico-ring-3" />
            <div className="ico-ring ico-ring-4" />
            <div className="ico-avatar-circle">
              <Phone size={42} className="ico-phone-shake" strokeWidth={2.4} />
            </div>
          </div>

          <div className="ico-caller-info">
            <div className="ico-room-label">Room {displayCall.roomNumber}</div>
            <div className="ico-guest-name">{displayCall.guestName}</div>
            <div className="ico-call-status">
              <span className="ico-dot" />
              Incoming call
            </div>
          </div>

          <div className="ico-action-row">
            <div className="ico-action" onClick={handleDecline}>
              <button
                type="button"
                className="ico-action-btn ico-action-decline"
                aria-label="Decline call"
              >
                <PhoneOff size={26} strokeWidth={2.4} />
              </button>
              <span>Decline</span>
            </div>

            <div
              className="ico-action"
              onClick={handleAccept}
              style={{
                pointerEvents: acceptClickedRef.current ? 'none' : 'auto',
              }}
            >
              <button
                type="button"
                className="ico-action-btn ico-action-accept"
                aria-label="Accept call"
                disabled={acceptClickedRef.current}
              >
                <Phone size={26} strokeWidth={2.4} />
              </button>
              <span>Accept</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE */}
      {displayCall && screen === 'active' && (
        <div className="ico-screen">
          <div className="ico-top-label ico-top-label-active">
            <Lock size={12} strokeWidth={2.5} />
            <span>
              {staffStatus === 'connected' ? 'ENCRYPTED CALL' : 'CONNECTING…'}
            </span>
          </div>

          <div className="ico-active-circle">
            <div className="ico-active-glow" />
            <Mic size={48} strokeWidth={2.4} />

            <div className="ico-waves">
              {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.6, 0.45, 0.3].map(
                (delay, i) => (
                  <span key={i} style={{ animationDelay: `${delay}s` }} />
                )
              )}
            </div>
          </div>

          <div className="ico-caller-info">
            <div className="ico-room-label">Room {displayCall.roomNumber}</div>
            <div className="ico-guest-name">{displayCall.guestName}</div>
            <div className="ico-timer">
              {staffStatus === 'connected' && originalAnsweredAt
                ? formatCallDuration(timerSec)
                : 'Connecting…'}
            </div>
          </div>

          <div className="ico-action-row">
            <div className="ico-action" onClick={handleEnd}>
              <button
                type="button"
                className="ico-action-btn ico-action-end"
                aria-label="End call"
              >
                <PhoneOff size={32} strokeWidth={2.4} />
              </button>
              <span>End Call</span>
            </div>
          </div>
        </div>
      )}

      {/* FAILED */}
      {displayCall && screen === 'failed' && (
        <div className="ico-screen">
          <div className="ico-top-label">
            <AlertCircle size={12} strokeWidth={2.5} />
            <span>CALL FAILED</span>
          </div>

          <div
            className="ico-active-circle"
            style={{ background: 'linear-gradient(145deg, #ef4444, #b91c1c)' }}
          >
            <AlertCircle size={48} strokeWidth={2.4} />
          </div>

          <div className="ico-caller-info">
            <div className="ico-room-label">Connection Failed</div>
            <div className="ico-guest-name">
              {errorMessage || 'Please try again'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingCallOverlay;