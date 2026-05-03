// src/hooks/calls/useWebRTCPeer.ts
import { useCallback, useEffect, useRef } from 'react';
import { ICE_SERVERS } from '@config/iceServers';
import { DISCONNECT_GRACE_MS } from '@config/callConfig';
import type { ICECandidate } from '@services/calls';

export type PeerConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

interface CreatePeerParams {
  onIceCandidate: (candidate: ICECandidate) => void;
  onConnectionStateChange: (state: PeerConnectionState) => void;
  onDisconnectTimeout: () => void;
}

interface UseWebRTCPeerResult {
  createPeer: (params: CreatePeerParams) => Promise<{
    peer: RTCPeerConnection;
    stream: MediaStream;
    audio: HTMLAudioElement;
  }>;
  silentlyClosePeer: (
    peer: RTCPeerConnection | null,
    stream: MediaStream | null,
    audio: HTMLAudioElement | null
  ) => void;
  clearDisconnectTimer: () => void;
}

export function useWebRTCPeer(): UseWebRTCPeerResult {
  const disconnectTimerRef = useRef<number | null>(null);

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const createPeer = useCallback(
    async ({
      onIceCandidate,
      onConnectionStateChange,
      onDisconnectTimeout,
    }: CreatePeerParams) => {
      // 1. Mikrofon ruxsati
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // 2. Remote audio element
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.volume = 1.0;
      document.body.appendChild(audio);

      // 3. Peer connection
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // 4. Local audio'ni peer'ga qo'shish
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // 5. Remote audio'ni eshitish
      peer.ontrack = ev => {
        if (ev.streams[0]) {
          audio.srcObject = ev.streams[0];
          audio.play().catch(err => {
            console.warn('[useWebRTCPeer] audio play failed:', err);
          });
        }
      };

      // 6. ICE candidate generation
      peer.onicecandidate = ev => {
        if (ev.candidate) {
          onIceCandidate({
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex,
          });
        }
      };

      // 7. Connection state change with disconnect grace
      peer.onconnectionstatechange = () => {
        const state = peer.connectionState as PeerConnectionState;
        console.log('[useWebRTCPeer] connectionState:', state);

        if (state === 'connected') {
          clearDisconnectTimer();
          onConnectionStateChange('connected');
        } else if (state === 'disconnected') {
          clearDisconnectTimer();
          disconnectTimerRef.current = window.setTimeout(() => {
            console.warn('[useWebRTCPeer] 15 sek disconnect — tugatilmoqda');
            onDisconnectTimeout();
          }, DISCONNECT_GRACE_MS);
          onConnectionStateChange('disconnected');
        } else if (state === 'failed' || state === 'closed') {
          clearDisconnectTimer();
          onConnectionStateChange(state);
        } else {
          onConnectionStateChange(state);
        }
      };

      return { peer, stream, audio };
    },
    [clearDisconnectTimer]
  );

    const silentlyClosePeer = useCallback(
    (
      peer: RTCPeerConnection | null,
      stream: MediaStream | null,
      audio: HTMLAudioElement | null
    ) => {
      clearDisconnectTimer();

      if (peer) {
        peer.onconnectionstatechange = null;
        peer.ontrack = null;
        peer.onicecandidate = null;
        try {
          peer.close();
        } catch {}
      }

      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      if (audio) {
        audio.srcObject = null;
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      }
    },
    [clearDisconnectTimer]
  );

  useEffect(() => {
    return () => {
      clearDisconnectTimer();
    };
  }, [clearDisconnectTimer]);

  return {
    createPeer,
    silentlyClosePeer,
    clearDisconnectTimer,
  };
}