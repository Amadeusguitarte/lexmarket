'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneIncoming,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { browserDB } from '@/lib/browser';
import Avatar from './Avatar';

export type CallKind = 'audio' | 'video';

export type CallSession = {
  callId: string;
  caseId: string;
  lawyerId: string;
  kind: CallKind;
  direction: 'outgoing' | 'incoming';
  peerName: string;
  peerAvatar?: string | null;
  caseTitle?: string;
  peerCallChannel?: string;
  selfCallChannel?: string;
  selfName?: string;
  selfAvatar?: string | null;
};

export type IncomingCall = {
  callId: string;
  caseId: string;
  lawyerId: string;
  kind: CallKind;
  fromName: string;
  fromAvatar?: string | null;
  caseTitle?: string;
  replyChannel?: string;
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

function getIceServers(): RTCIceServer[] {
  try {
    const raw = process.env.NEXT_PUBLIC_ICE_SERVERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return DEFAULT_ICE_SERVERS;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTone(pattern: 'ringing' | 'incoming'): () => void {
  if (typeof window === 'undefined') return () => {};
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return () => {};
  let ctx: AudioContext | null = null;
  let stopped = false;

  const playPulse = () => {
    if (stopped) return;
    try {
      ctx = ctx || new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pattern === 'incoming' ? 523.25 : 440, now);
      if (pattern === 'incoming') {
        osc.frequency.setValueAtTime(659.25, now + 0.18);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (pattern === 'incoming' ? 0.45 : 0.6));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (pattern === 'incoming' ? 0.48 : 0.65));
    } catch {}
  };

  playPulse();
  const interval = setInterval(playPulse, pattern === 'incoming' ? 2200 : 2800);
  return () => {
    stopped = true;
    clearInterval(interval);
    if (ctx) {
      void ctx.close().catch(() => {});
      ctx = null;
    }
  };
}

export function IncomingCallBanner({
  call,
  onAccept,
  onReject,
}: {
  call: IncomingCall;
  onAccept: (kind: CallKind) => void;
  onReject: () => void;
}) {
  useEffect(() => {
    return startTone('incoming');
  }, [call.callId]);

  return (
    <aside className="incoming-call-banner" role="alertdialog" aria-label="Llamada entrante">
      <div className="incoming-call-head">
        <span className="incoming-call-badge">
          {call.kind === 'video' ? <Video size={14} /> : <PhoneIncoming size={14} />}
          {call.kind === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante'}
        </span>
      </div>
      <div className="incoming-call-peer">
        <Avatar name={call.fromName || 'Contacto'} url={call.fromAvatar} large />
        <div className="incoming-call-meta">
          <strong>{call.fromName || 'Conversación'}</strong>
          {call.caseTitle && <small>{call.caseTitle}</small>}
        </div>
      </div>
      <div className="incoming-call-actions">
        <button type="button" className="call-btn reject" onClick={onReject}>
          <PhoneOff size={16} />
          <span>Rechazar</span>
        </button>
        {call.kind === 'video' && (
          <button
            type="button"
            className="call-btn accept-audio"
            onClick={() => onAccept('audio')}
            title="Contestar solo con audio"
          >
            <Phone size={16} />
            <span>Solo voz</span>
          </button>
        )}
        <button type="button" className="call-btn accept" onClick={() => onAccept(call.kind)}>
          {call.kind === 'video' ? <Video size={16} /> : <Phone size={16} />}
          <span>Contestar</span>
        </button>
      </div>
    </aside>
  );
}

export default function CallOverlay({
  session,
  userId,
  onEnd,
}: {
  session: CallSession;
  userId: string;
  onEnd: () => void;
}) {
  const [phase, setPhase] = useState<'starting' | 'ringing' | 'connecting' | 'connected' | 'ended'>('starting');
  const [statusText, setStatusText] = useState(
    session.direction === 'outgoing' ? 'Preparando llamada…' : 'Conectando llamada…'
  );
  const [errorText, setErrorText] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(session.kind !== 'video');
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const roomChannelRef = useRef<any>(null);
  const inviteChannelRef = useRef<any>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const offerSentRef = useRef(false);
  const closedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const attachStreams = () => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    }
  };

  useEffect(() => {
    attachStreams();
  }, [minimized, cameraOff, remoteHasVideo, phase]);

  useEffect(() => {
    if (phase !== 'connected') return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'ringing' && session.direction === 'outgoing') {
      return startTone('ringing');
    }
  }, [phase, session.direction]);

  const cleanupMediaAndPc = () => {
    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((tr) => {
        try {
          tr.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
  };

  const finishCall = (reason?: string, notifyRemote = false, signalType: 'call-end' | 'call-cancel' = 'call-end') => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (notifyRemote) {
      try {
        roomChannelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: signalType, callId: session.callId, from: userId },
        });
      } catch {}
      try {
        inviteChannelRef.current?.send({
          type: 'broadcast',
          event: 'call-invite',
          payload: { type: signalType, callId: session.callId, from: userId },
        });
      } catch {}
    }
    cleanupMediaAndPc();
    if (reason) {
      setPhase('ended');
      setStatusText(reason);
      setTimeout(() => onEndRef.current(), 1200);
    } else {
      onEndRef.current();
    }
  };

  useEffect(() => {
    closedRef.current = false;
    offerSentRef.current = false;
    pendingIceRef.current = [];

    const db = browserDB();
    if (!db) {
      setErrorText('El servicio de llamadas en tiempo real no está disponible.');
      setPhase('ended');
      return;
    }
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorText('Tu navegador no soporta llamadas de audio/video o requiere una conexión segura (HTTPS).');
      setPhase('ended');
      return;
    }

    let ringInterval: ReturnType<typeof setInterval> | null = null;
    let ringTimeout: ReturnType<typeof setTimeout> | null = null;

    const createPeerConnection = (roomChannel: any) => {
      if (pcRef.current) return pcRef.current;
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.ontrack = (event) => {
        const tracks = event.streams?.[0]?.getTracks() || [event.track];
        tracks.forEach((tr) => {
          if (!remoteStream.getTracks().some((t) => t.id === tr.id)) {
            remoteStream.addTrack(tr);
          }
          if (tr.kind === 'video') {
            setRemoteHasVideo(true);
            tr.onended = () => setRemoteHasVideo(remoteStream.getVideoTracks().some((v) => v.readyState === 'live'));
          }
        });
        attachStreams();
        setPhase('connected');
        setStatusText('En llamada');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void roomChannel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'ice-candidate',
              callId: session.callId,
              from: userId,
              candidate: event.candidate.toJSON(),
            },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (closedRef.current) return;
        const st = pc.connectionState;
        if (st === 'connected') {
          setPhase('connected');
          setStatusText('En llamada');
        } else if (st === 'disconnected') {
          setStatusText('Reconectando audio y video…');
        } else if (st === 'failed') {
          finishCall('La conexión se interrumpió.', false);
        }
      };

      pcRef.current = pc;
      return pc;
    };

    const flushCandidates = async (pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current.splice(0);
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
    };

    const sendOffer = async (roomChannel: any) => {
      if (offerSentRef.current || closedRef.current) return;
      offerSentRef.current = true;
      if (ringInterval) clearInterval(ringInterval);
      if (ringTimeout) clearTimeout(ringTimeout);
      setPhase('connecting');
      setStatusText('Conectando…');
      const pc = createPeerConnection(roomChannel);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      await roomChannel.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          callId: session.callId,
          from: userId,
          sdp: pc.localDescription,
        },
      });
    };

    const start = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: session.kind === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          });
        } catch (mediaErr: any) {
          if (session.kind === 'video') {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setCameraOff(true);
            setStatusText('Sin cámara disponible — continuando solo con audio');
          } else {
            throw mediaErr;
          }
        }

        if (closedRef.current) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }

        localStreamRef.current = stream;
        setCameraOff(stream.getVideoTracks().length === 0);
        attachStreams();

        const roomName = `call-room-${session.caseId}-${session.lawyerId}`;
        const roomChannel = db.channel(roomName, { config: { broadcast: { self: false } } });
        roomChannelRef.current = roomChannel;

        roomChannel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
          if (!payload || payload.callId !== session.callId || payload.from === userId || closedRef.current) return;

          try {
            if (payload.type === 'call-ready' || payload.type === 'call-accept') {
              if (session.direction === 'outgoing') {
                await sendOffer(roomChannel);
              }
            } else if (payload.type === 'offer' && payload.sdp) {
              setPhase('connecting');
              setStatusText('Conectando…');
              const pc = createPeerConnection(roomChannel);
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              await flushCandidates(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await roomChannel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'answer',
                  callId: session.callId,
                  from: userId,
                  sdp: pc.localDescription,
                },
              });
            } else if (payload.type === 'answer' && payload.sdp) {
              const pc = pcRef.current;
              if (pc && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                await flushCandidates(pc);
              }
            } else if (payload.type === 'ice-candidate' && payload.candidate) {
              const pc = pcRef.current;
              if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                pendingIceRef.current.push(payload.candidate);
              }
            } else if (payload.type === 'call-reject') {
              finishCall(`${session.peerName} rechazó la llamada.`, false);
            } else if (payload.type === 'call-end' || payload.type === 'call-cancel') {
              finishCall('Llamada finalizada.', false);
            }
          } catch (err) {
            console.error('WebRTC signal error:', err);
          }
        });

        roomChannel.subscribe((status: string) => {
          if (status !== 'SUBSCRIBED' || closedRef.current) return;

          if (session.direction === 'incoming') {
            setPhase('connecting');
            setStatusText('Conectando con ' + session.peerName + '…');
            void roomChannel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'call-accept', callId: session.callId, from: userId },
            });
          } else {
            setPhase('ringing');
            setStatusText('Llamando a ' + session.peerName + '…');

            const sendInvite = () => {
              const invitePayload = {
                type: 'call-invite',
                callId: session.callId,
                caseId: session.caseId,
                lawyerId: session.lawyerId,
                kind: session.kind,
                from: userId,
                fromName: session.selfName || 'Contacto',
                fromAvatar: session.selfAvatar || null,
                caseTitle: session.caseTitle || '',
                replyChannel: session.selfCallChannel || '',
              };
              void roomChannel.send({ type: 'broadcast', event: 'call-invite', payload: invitePayload });
              if (inviteChannelRef.current) {
                void inviteChannelRef.current.send({ type: 'broadcast', event: 'call-invite', payload: invitePayload });
              }
            };

            if (session.peerCallChannel) {
              const peerCh = db.channel(session.peerCallChannel, { config: { broadcast: { self: false } } });
              inviteChannelRef.current = peerCh;
              peerCh.subscribe((st: string) => {
                if (st === 'SUBSCRIBED' && !closedRef.current) {
                  sendInvite();
                }
              });
            } else {
              sendInvite();
            }

            ringInterval = setInterval(() => {
              if (!offerSentRef.current && !closedRef.current) sendInvite();
            }, 3000);

            ringTimeout = setTimeout(() => {
              if (!offerSentRef.current && !closedRef.current) {
                finishCall('Sin respuesta.', true, 'call-cancel');
              }
            }, 40000);
          }
        });
      } catch (err: any) {
        const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        const notFound = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
        setErrorText(
          denied
            ? 'Permite el acceso al micrófono y la cámara en tu navegador para realizar la llamada.'
            : notFound
            ? 'No se detectó un micrófono o cámara disponible en este dispositivo.'
            : 'No pudimos iniciar la llamada. Revisa los permisos de audio y video.'
        );
        setPhase('ended');
      }
    };

    void start();

    return () => {
      closedRef.current = true;
      if (ringInterval) clearInterval(ringInterval);
      if (ringTimeout) clearTimeout(ringTimeout);
      cleanupMediaAndPc();
      if (roomChannelRef.current) void db.removeChannel(roomChannelRef.current);
      if (inviteChannelRef.current) void db.removeChannel(inviteChannelRef.current);
    };
  }, [session.callId]);

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    const next = !muted;
    tracks.forEach((t) => {
      t.enabled = !next;
    });
    setMuted(next);
  };

  const toggleCamera = async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    setErrorText('');
    const existing = stream.getVideoTracks();
    if (existing.length > 0) {
      const nextOff = !cameraOff;
      existing.forEach((t) => {
        t.enabled = !nextOff;
      });
      setCameraOff(nextOff);
      return;
    }
    // Upgrade audio-only call to include camera if requested
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const videoTrack = camStream.getVideoTracks()[0];
      if (!videoTrack) return;
      stream.addTrack(videoTrack);
      setCameraOff(false);
      attachStreams();
      const pc = pcRef.current;
      if (pc && roomChannelRef.current) {
        pc.addTrack(videoTrack, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        void roomChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'offer', callId: session.callId, from: userId, sdp: pc.localDescription },
        });
      }
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorText('No se detectó ninguna cámara conectada en este dispositivo.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setErrorText('Otra aplicación está usando la cámara en este momento.');
      } else {
        setErrorText('Permite el acceso a la cámara en los ajustes del navegador (icono al lado de la URL).');
      }
    }
  };

  return (
    <div
      className={'call-overlay ' + (minimized ? 'is-minimized' : '')}
      role="dialog"
      aria-label={session.kind === 'video' ? 'Videollamada en curso' : 'Llamada en curso'}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <header className="call-header">
        <div className="call-header-info">
          <span className={'call-live-dot ' + (phase === 'connected' ? 'live' : '')} />
          <div>
            <strong>{session.peerName}</strong>
            <small>
              {phase === 'connected' ? formatDuration(elapsed) : statusText}
              {session.caseTitle && !minimized ? ` · ${session.caseTitle}` : ''}
            </small>
          </div>
        </div>
        <div className="call-header-actions">
          <button
            type="button"
            className="call-icon-btn"
            onClick={() => setMinimized((m) => !m)}
            aria-label={minimized ? 'Expandir llamada' : 'Minimizar llamada'}
            title={minimized ? 'Expandir llamada' : 'Minimizar llamada'}
          >
            {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
      </header>

      {!minimized && (
        <div className={'call-stage ' + (remoteHasVideo ? 'has-remote-video' : '')}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={'call-remote-video ' + (remoteHasVideo ? 'visible' : '')}
          />
          {!remoteHasVideo && (
            <div className="call-avatar-stage">
              <div className={'call-avatar-ring ' + (phase === 'ringing' || phase === 'connecting' ? 'pulsing' : '')}>
                <Avatar name={session.peerName} url={session.peerAvatar} large />
              </div>
              <h3>{session.peerName}</h3>
              <p className="call-status-label">
                {phase === 'connected' ? (
                  <>
                    <Volume2 size={14} /> En llamada · {formatDuration(elapsed)}
                  </>
                ) : (
                  statusText
                )}
              </p>
            </div>
          )}

          {!cameraOff && (
            <div className="call-local-pip">
              <video ref={localVideoRef} autoPlay playsInline muted />
            </div>
          )}

          {errorText && (
            <div className="call-error-banner" role="alert">
              {errorText}
            </div>
          )}
        </div>
      )}

      <footer className="call-controls">
        <button
          type="button"
          className={'call-ctrl-btn ' + (muted ? 'is-off' : '')}
          onClick={toggleMute}
          aria-label={muted ? 'Activar micrófono' : 'Silenciar micrófono'}
          title={muted ? 'Activar micrófono' : 'Silenciar micrófono'}
          disabled={phase === 'ended'}
        >
          {muted ? <MicOff size={19} /> : <Mic size={19} />}
        </button>
        <button
          type="button"
          className={'call-ctrl-btn ' + (cameraOff ? 'is-off' : '')}
          onClick={() => void toggleCamera()}
          aria-label={cameraOff ? 'Activar cámara' : 'Apagar cámara'}
          title={cameraOff ? 'Activar cámara' : 'Apagar cámara'}
          disabled={phase === 'ended'}
        >
          {cameraOff ? <VideoOff size={19} /> : <Video size={19} />}
        </button>
        <button
          type="button"
          className="call-ctrl-btn hangup"
          onClick={() => finishCall(undefined, true, phase === 'ringing' ? 'call-cancel' : 'call-end')}
          aria-label="Colgar llamada"
          title="Colgar llamada"
        >
          <PhoneOff size={19} />
        </button>
      </footer>
    </div>
  );
}
