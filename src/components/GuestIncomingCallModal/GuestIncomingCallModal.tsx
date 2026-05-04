// src/components/GuestIncomingCallModal/GuestIncomingCallModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useWebRTCPeer } from '@hooks/calls/useWebRTCPeer';
import { useIceCandidateBatch } from '@hooks/calls/useIceCandidateBatch';
import { useRingtone } from '@hooks/calls/useIncomingCalls';
import {
  answerCallByGuest,
  getCallStatus,
  endCall as endCallApi,
} from '@services/calls';
import { GUEST_POLL_INTERVAL_MS } from '@config/callConfig';
import { formatCallDuration, elapsedSecondsFrom } from '@utils/callTimer';
import './GuestIncomingCallModal.css';

interface Props {
  callId: string;
  offerSdp: string;
  callerName: string;
  guestName: string;
  roomNumber: string;
  onClose: () => void;
}

type Phase = 'ringing' | 'accepting' | 'connected' | 'ended' | 'failed';

const GuestIncomingCallModal: React.FC<Props> = ({
  callId,
  offerSdp,
  callerName,
  guestName,
  roomNumber,
  onClose,
}) => {
  // ═══════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════
  const [phase, setPhase] = useState<Phase>('ringing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timerSec, setTimerSec] = useState<number>(0);
  const [originalAnsweredAt, setOriginalAnsweredAt] = useState<number | null>(
    null
  );

  // ═══════════════════════════════════════════════════════
  // REFS
  // ═══════════════════════════════════════════════════════
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const addedStaffIceCountRef = useRef<number>(0);
  const acceptingRef = useRef<boolean>(false);

  // ═══════════════════════════════════════════════════════
  // ⭐ RINGTONE — faqat 'ringing' fazasida o'ynaydi
  // Web Audio API orqali (mp3 fayl kerak emas)
  // Avtomatik to'xtaydi: Accept/Decline/End yoki call ended bo'lganda
  // ═══════════════════════════════════════════════════════
  useRingtone(phase === 'ringing');

  // ═══════════════════════════════════════════════════════
  // WebRTC HOOKS
  // ═══════════════════════════════════════════════════════
  const { createPeer, silentlyClosePeer } = useWebRTCPeer();
  const { enqueue: enqueueIce, reset: resetIceQueue } = useIceCandidateBatch({
    getCallId: () => callId,
    from: 'guest',
  });

  // ═══════════════════════════════════════════════════════
  // Body scroll lock — modal ochiq bo'lganda sahifa scroll bo'lmaydi
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // ═══════════════════════════════════════════════════════
  // Cleanup — barcha resurslarni tozalash
  // ═══════════════════════════════════════════════════════
  const cleanup = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    silentlyClosePeer(
      peerRef.current,
      localStreamRef.current,
      remoteAudioRef.current
    );
    peerRef.current = null;
    localStreamRef.current = null;
    remoteAudioRef.current = null;
    resetIceQueue();
    addedStaffIceCountRef.current = 0;
  };

  // ═══════════════════════════════════════════════════════
  // Status polling — Manager ICE candidates va call status
  // ═══════════════════════════════════════════════════════
  const pollStatus = async () => {
    const peer = peerRef.current;
    if (!callId || !peer) return;

    try {
      const data = await getCallStatus(callId);

      // Call tugadi (Manager hangup yoki missed)
      if (data.status === 'ended' || data.status === 'missed') {
        setPhase('ended');
        setTimeout(() => {
          cleanup();
          onClose();
        }, 1000);
        return;
      }

      // Yangi Manager ICE candidates qo'shish
      if (
        data.iceStaff &&
        data.iceStaff.length > addedStaffIceCountRef.current &&
        peer.remoteDescription
      ) {
        const newCandidates = data.iceStaff.slice(
          addedStaffIceCountRef.current
        );
        for (const c of newCandidates) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            // ignore — already added or invalid
          }
        }
        addedStaffIceCountRef.current = data.iceStaff.length;
      }
    } catch {
      // silent — keyingi pollingda qayta urinadi
    }
  };

  // ═══════════════════════════════════════════════════════
  // Timer — connected bo'lganidan keyin har sekundda yangilash
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== 'connected' || !originalAnsweredAt) return;

    const update = () => setTimerSec(elapsedSecondsFrom(originalAnsweredAt));
    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [phase, originalAnsweredAt]);

  // ═══════════════════════════════════════════════════════
  // ACCEPT — Mehmon Manager qo'ng'irog'iga javob beradi
  // ═══════════════════════════════════════════════════════
  const handleAccept = async () => {
    if (acceptingRef.current) return;
    acceptingRef.current = true;

    setPhase('accepting'); // ⭐ Bu ringtone'ni avtomatik to'xtatadi
    setErrorMessage('');

    try {
      // 1) Peer + mikrofon yaratish
      const { peer, stream, audio } = await createPeer({
        onIceCandidate: enqueueIce,
        onConnectionStateChange: state => {
          if (state === 'connected') {
            setPhase('connected');
          } else if (state === 'failed' || state === 'closed') {
            setPhase('ended');
            setTimeout(() => {
              cleanup();
              onClose();
            }, 1000);
          }
        },
        onDisconnectTimeout: () => {
          setPhase('ended');
          cleanup();
          onClose();
        },
      });

      // 2) Manager offer'ini o'rnatish
      await peer.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(offerSdp))
      );

      // 3) Answer yaratish
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // 4) Backend'ga answer yuborish
      const result = await answerCallByGuest(
        callId,
        JSON.stringify(peer.localDescription)
      );

      if (!result.success) {
        if (result.alreadyAnswered) {
          throw new Error('Call already ended');
        }
        throw new Error('Failed to answer');
      }

      // 5) Pre-buffered staff ICE candidates qo'shish
      if (result.iceStaff && result.iceStaff.length > 0) {
        for (const c of result.iceStaff) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch {
            // ignore
          }
        }
        addedStaffIceCountRef.current = result.iceStaff.length;
      }

      // 6) Refs'ga saqlash
      peerRef.current = peer;
      localStreamRef.current = stream;
      remoteAudioRef.current = audio;

      // 7) Timer uchun originalAnsweredAt
      if (result.originalAnsweredAt) {
        setOriginalAnsweredAt(new Date(result.originalAnsweredAt).getTime());
      } else {
        setOriginalAnsweredAt(Date.now());
      }

      // 8) Polling boshlash (status + ICE)
      pollTimerRef.current = window.setInterval(
        pollStatus,
        GUEST_POLL_INTERVAL_MS
      );
    } catch (err: unknown) {
      console.error('[GuestIncomingCallModal] accept error:', err);

      let msg = 'Could not accept call';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          msg = 'Microphone access denied.';
        } else if (err.message) {
          msg = err.message;
        }
      }

      setErrorMessage(msg);
      setPhase('failed');
      cleanup();
      setTimeout(onClose, 2500);
    } finally {
      acceptingRef.current = false;
    }
  };

  // ═══════════════════════════════════════════════════════
  // DECLINE — Mehmon qo'ng'iroqni rad etadi
  // ═══════════════════════════════════════════════════════
  const handleDecline = async () => {
    try {
      await endCallApi(callId);
    } catch {
      // ignore — backend xatosi bo'lsa ham UI yopiladi
    }
    cleanup();
    onClose();
  };

  // ═══════════════════════════════════════════════════════
  // END — Connected paytida tugatish
  // ═══════════════════════════════════════════════════════
  const handleEnd = async () => {
    try {
      await endCallApi(callId);
    } catch {
      // ignore
    }
    cleanup();
    onClose();
  };

  // ═══════════════════════════════════════════════════════
  // Cleanup unmount
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="gicm-overlay">
      {/* RINGING — Manager dan kelayotgan call */}
      {phase === 'ringing' && (
        <>
          <div className="gicm-ring-wrap">
            <div className="gicm-ring gicm-ring-1" />
            <div className="gicm-ring gicm-ring-2" />
            <div className="gicm-ring gicm-ring-3" />
            <div className="gicm-avatar">
              <Phone size={42} strokeWidth={2.4} />
            </div>
          </div>

          <div className="gicm-info">
            <div className="gicm-label">INCOMING CALL</div>
            <div className="gicm-name">{callerName}</div>
            <div className="gicm-sub">
              Room {roomNumber} — {guestName}
            </div>
          </div>

          <div className="gicm-actions">
            <div className="gicm-action" onClick={handleDecline}>
              <button
                type="button"
                className="gicm-action-btn gicm-action-decline"
                aria-label="Decline call"
              >
                <PhoneOff size={26} strokeWidth={2.4} />
              </button>
              <span>Decline</span>
            </div>

            <div className="gicm-action" onClick={handleAccept}>
              <button
                type="button"
                className="gicm-action-btn gicm-action-accept"
                aria-label="Accept call"
              >
                <Phone size={26} strokeWidth={2.4} />
              </button>
              <span>Accept</span>
            </div>
          </div>
        </>
      )}

      {/* ACCEPTING / CONNECTED — Ulangan yoki ulanmoqda */}
      {(phase === 'accepting' || phase === 'connected') && (
        <>
          <div className="gicm-active-circle">
            <Phone size={42} color="#22c55e" strokeWidth={2.4} />
          </div>

          <div className="gicm-info">
            <div className="gicm-label">
              {phase === 'connected' ? 'CONNECTED' : 'CONNECTING…'}
            </div>
            <div className="gicm-name">{callerName}</div>
            {phase === 'connected' && originalAnsweredAt && (
              <div className="gicm-timer">{formatCallDuration(timerSec)}</div>
            )}
          </div>

          <button
            type="button"
            className="gicm-end-btn"
            onClick={handleEnd}
            aria-label="End call"
          >
            <PhoneOff size={26} color="#fff" strokeWidth={2.4} />
          </button>
        </>
      )}

      {/* FAILED — Xato yuz berdi */}
      {phase === 'failed' && (
        <div className="gicm-info">
          <div className="gicm-label" style={{ color: '#fbbf24' }}>
            CALL FAILED
          </div>
          <div className="gicm-sub">{errorMessage}</div>
        </div>
      )}

      {/* ENDED — Call tugadi (qisqa muddat ko'rsatish) */}
      {phase === 'ended' && (
        <div className="gicm-info">
          <div className="gicm-label" style={{ color: '#94a3b8' }}>
            CALL ENDED
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestIncomingCallModal;
