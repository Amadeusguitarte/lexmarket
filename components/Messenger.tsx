'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Download,
  Eye,
  FileText,
  Maximize2,
  MessageCircle,
  Minimize2,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';
import { api, browserDB } from '@/lib/browser';
import { Field, Modal, type Row } from './Forms';
import Avatar from './Avatar';
import CallOverlay, {
  IncomingCallBanner,
  type CallKind,
  type CallSession,
  type IncomingCall,
} from './CallOverlay';

export type ChatTarget = { case_id: string; lawyer_id: string };

type StagedFile = {
  file: File;
  name: string;
  size: number;
  isPdf: boolean;
  previewUrl: string | null;
};

type PeerDetail = {
  name: string;
  avatar?: string;
  caseTitle?: string;
  peerCallChannel?: string;
};

const threadCache = new Map<string, { value: Row; at: number }>();
const money = (n: unknown) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
const date = (s?: string) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
};
const time = (s?: string) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};
const formatSize = (bytes: number) => {
  const b = Number(bytes) || 0;
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  return Math.max(1, Math.round(b / 1024)) + ' KB';
};
const isPdfFile = (name?: string, mime?: string) =>
  mime === 'application/pdf' || Boolean(name && name.toLowerCase().endsWith('.pdf'));
const isRealMsg = (m: Row) => Boolean(m && m.id && m.id !== 'last-seed' && !m._seed);

export default function Messenger({
  userId,
  userName,
  userAvatar,
  open,
  target,
  onOpen,
  onClose,
  onSelect,
  onCase,
  mode = 'floating',
  onAll,
  assistantOpen = false,
}: {
  userId: string;
  userName?: string;
  userAvatar?: string;
  open: boolean;
  target: ChatTarget | null;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (t: ChatTarget | null) => void;
  onCase: (id: string) => void;
  mode?: 'floating' | 'page';
  onAll?: () => void;
  assistantOpen?: boolean;
}) {
  const [items, setItems] = useState<Row[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = sessionStorage.getItem('lexmarket.inbox.' + userId);
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        }
      } catch {}
    }
    return [];
  });
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [windows, setWindows] = useState<ChatTarget[]>([]);
  const [minimized, setMinimized] = useState<string[]>([]);
  const [slots, setSlots] = useState(1);
  const [peerDetails, setPeerDetails] = useState<Record<string, PeerDetail>>({});
  const [selfCallChannel, setSelfCallChannel] = useState('');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const activeCallRef = useRef<CallSession | null>(null);
  activeCallRef.current = activeCall;

  const key = (t?: ChatTarget | Row | null) =>
    t ? (t.case_id || '') + (t.lawyer_id || '') : '';

  const handlePeerInfo = useCallback((k: string, info: PeerDetail) => {
    setPeerDetails((prev) => {
      const cur = prev[k];
      if (
        cur &&
        cur.name === info.name &&
        cur.avatar === info.avatar &&
        cur.caseTitle === info.caseTitle &&
        cur.peerCallChannel === info.peerCallChannel
      ) {
        return prev;
      }
      return { ...prev, [k]: info };
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await api('chats');
      const list = Array.isArray(d?.items) ? d.items.filter(Boolean) : [];
      if (typeof d?.self_call_channel === 'string' && d.self_call_channel) {
        setSelfCallChannel(d.self_call_channel);
      }
      setItems(list);
      setError('');
      try {
        sessionStorage.setItem('lexmarket.inbox.' + userId, JSON.stringify(list));
      } catch {}
    } catch (e) {
      setError((e as Error).message);
    }
  }, [userId]);

  useEffect(() => {
    const resize = () =>
      setSlots(
        Math.max(1, Math.min(3, Math.floor((window.innerWidth - (open ? 440 : 380)) / 400)))
      );
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);

  useEffect(() => {
    if (target) {
      setWindows((w) => [target, ...w.filter((x) => key(x) !== key(target))]);
      setMinimized((m) => m.filter((k) => k !== key(target)));
    }
  }, [target]);

  useEffect(() => {
    void load();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 100);
    };
    const db = browserDB();
    const channel = db
      ? db
          .channel('inbox-' + userId)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, refresh)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: 'recipient_id=eq.' + userId,
            },
            refresh
          )
          .subscribe()
      : null;
    window.addEventListener('lexmarket-update', refresh);
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 20000);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener('lexmarket-update', refresh);
      if (db && channel) void db.removeChannel(channel);
    };
  }, [userId, load]);

  useEffect(() => {
    if (!selfCallChannel) return;
    const db = browserDB();
    if (!db) return;
    const callCh = db
      .channel(selfCallChannel, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'call-invite' }, ({ payload }: any) => {
        if (!payload || payload.from === userId) return;
        if (payload.type === 'call-cancel' || payload.type === 'call-end') {
          setIncomingCall((cur) => (cur && cur.callId === payload.callId ? null : cur));
          return;
        }
        if (payload.type === 'call-invite' && !activeCallRef.current) {
          setIncomingCall({
            callId: String(payload.callId),
            caseId: String(payload.caseId),
            lawyerId: String(payload.lawyerId),
            kind: payload.kind === 'video' ? 'video' : 'audio',
            fromName: String(payload.fromName || 'Contacto'),
            fromAvatar: payload.fromAvatar || null,
            caseTitle: String(payload.caseTitle || ''),
            replyChannel: String(payload.replyChannel || ''),
          });
        }
      })
      .subscribe();
    return () => {
      void db.removeChannel(callCh);
    };
  }, [selfCallChannel, userId]);

  const unread = items.reduce((n, i) => n + (i.unread || 0), 0);

  const select = (t: ChatTarget) => {
    setWindows((w) => [t, ...w.filter((x) => key(x) !== key(t))]);
    setMinimized((m) => m.filter((k) => k !== key(t)));
    onSelect(t);
  };

  const startCall = (t: ChatTarget, kind: CallKind, extra?: Partial<PeerDetail>) => {
    const k = key(t);
    const i = items.find((item) => key(item) === k);
    const detail = peerDetails[k];
    setIncomingCall(null);
    setActiveCall({
      callId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      caseId: t.case_id,
      lawyerId: t.lawyer_id,
      kind,
      direction: 'outgoing',
      peerName: extra?.name || detail?.name || i?.peer?.name || 'Conversación',
      peerAvatar: extra?.avatar ?? detail?.avatar ?? i?.peer?.avatar_url ?? null,
      caseTitle: extra?.caseTitle || detail?.caseTitle || i?.title || '',
      peerCallChannel: extra?.peerCallChannel || detail?.peerCallChannel || i?.peer_call_channel || '',
      selfCallChannel,
      selfName: userName || 'Contacto',
      selfAvatar: userAvatar || null,
    });
  };

  const acceptIncomingCall = (kind: CallKind) => {
    if (!incomingCall) return;
    const targetThread: ChatTarget = {
      case_id: incomingCall.caseId,
      lawyer_id: incomingCall.lawyerId,
    };
    select(targetThread);
    setActiveCall({
      callId: incomingCall.callId,
      caseId: incomingCall.caseId,
      lawyerId: incomingCall.lawyerId,
      kind,
      direction: 'incoming',
      peerName: incomingCall.fromName,
      peerAvatar: incomingCall.fromAvatar || null,
      caseTitle: incomingCall.caseTitle || '',
      peerCallChannel: incomingCall.replyChannel || '',
      selfCallChannel,
      selfName: userName || 'Contacto',
      selfAvatar: userAvatar || null,
    });
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    const db = browserDB();
    const callToReject = incomingCall;
    setIncomingCall(null);
    if (!db) return;
    const ch = db.channel(`call-room-${callToReject.caseId}-${callToReject.lawyerId}`, {
      config: { broadcast: { self: false } },
    });
    ch.subscribe((st: string) => {
      if (st === 'SUBSCRIBED') {
        void Promise.resolve(
          ch.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'call-reject', callId: callToReject.callId, from: userId },
          })
        ).finally(() => void db.removeChannel(ch));
      }
    });
  };

  const callUi = (
    <>
      {incomingCall && !activeCall && (
        <IncomingCallBanner
          call={incomingCall}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}
      {activeCall && (
        <CallOverlay session={activeCall} userId={userId} onEnd={() => setActiveCall(null)} />
      )}
    </>
  );

  const inbox = (
    <div className="chat-inbox">
      {mode === 'page' ? (
        <div className="chat-intro">
          <h2>Mensajes</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una persona o un caso"
            aria-label="Buscar mensajes"
          />
        </div>
      ) : (
        <div className="chat-intro popover-intro">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una persona o un caso"
            aria-label="Buscar mensajes"
          />
        </div>
      )}
      {error && (
        <p className="notice-panel error">
          {error}
          <button onClick={() => void load()}>Reintentar</button>
        </p>
      )}
      {items
        .filter((i) =>
          ((i.peer?.name || '') + ' ' + (i.title || ''))
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .map((i) => (
          <button
            className={'inbox-row ' + (target && key(target) === key(i) ? 'selected' : '')}
            key={key(i)}
            onClick={() => select({ case_id: i.case_id, lawyer_id: i.lawyer_id })}
          >
            <Avatar name={i.peer?.name || 'Conversación'} url={i.peer?.avatar_url} />
            <span>
              <strong>{i.peer?.name || 'Conversación'}</strong>
              <small>{i.title}</small>
              <p>
                {i.last?.sender_id === userId ? 'Tú: ' : ''}
                {i.last?.body || 'Nueva solicitud. Pueden empezar a conversar.'}
              </p>
            </span>
            {i.unread > 0 && <b className="unread-pill">{i?.unread}</b>}
          </button>
        ))}
      {!items.length && !error && (
        <div className="chat-empty">
          <MessageCircle />
          <h3>No tienes mensajes aún</h3>
          <p>Cuando un profesional te contacte, podrás chatear aquí.</p>
        </div>
      )}
    </div>
  );

  if (mode === 'page') {
    return (
      <>
        <section
          className={'messages-page ' + (target ? 'has-thread' : '')}
          aria-label="Centro de mensajes"
        >
          {inbox}
          <div className="messages-detail">
            {target ? (
              <Conversation
                key={key(target)}
                target={target}
                userId={userId}
                initialItem={items.find((x) => key(x) === key(target))}
                onBack={() => onSelect(null)}
                onRead={() => void load()}
                onCase={() => onCase(target.case_id)}
                onPeerInfo={(info) => handlePeerInfo(key(target), info)}
                onStartCall={(kind, info) => startCall(target, kind, info)}
              />
            ) : (
              <div className="chat-empty">
                <MessageCircle size={42} />
                <h2>Una conversación a la vez.</h2>
                <p>Selecciona a alguien a la izquierda para continuar.</p>
              </div>
            )}
          </div>
        </section>
        {callUi}
      </>
    );
  }

  const visible = windows.filter((t) => !minimized.includes(key(t))).slice(0, slots);
  const handleLauncherClick = () => {
    if (assistantOpen) {
      onOpen();
      return;
    }
    if (open) {
      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <>
      <button
        className="chat-launcher"
        onClick={handleLauncherClick}
        aria-label="Abrir bandeja de mensajes"
      >
        <MessageCircle size={22} />
        <span>Mensajes</span>
        {unread > 0 && <b>{unread}</b>}
      </button>
      {!assistantOpen && open && (
        <section className="messenger inbox-popover">
          <header className="messenger-heading">
            <b>Mensajes</b>
            <button className="icon-button" onClick={onClose} aria-label="Cerrar bandeja">
              <X />
            </button>
          </header>
          {inbox}
          <button className="button outline small" onClick={onAll}>
            Ver todos los mensajes
          </button>
        </section>
      )}
      {!assistantOpen && (
        <div className={'chat-dock ' + (open ? 'dock-offset-inbox' : '')}>
          {windows.map((t) => {
            const k = key(t);
            const i = items.find((item) => key(item) === k);
            const detail = peerDetails[k];
            const collapsed = !visible.some((v) => key(v) === k);
            const peerName = detail?.name || i?.peer?.name || 'Conversación';
            const peerAvatar = detail?.avatar || i?.peer?.avatar_url;
            const caseTitle = detail?.caseTitle || i?.title || '';
            return (
              <section key={k} className={'dock-window ' + (collapsed ? 'is-minimized' : '')}>
                <header
                  className="messenger-heading dock-heading conversation-unified-header"
                  title={collapsed ? 'Abrir conversación' : 'Minimizar conversación'}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button:not(.dock-title)')) return;
                    if (collapsed) {
                      setMinimized((m) => m.filter((x) => x !== k));
                      onSelect(t);
                    } else {
                      setMinimized((m) => [...m, k]);
                    }
                  }}
                >
                  <div className="dock-heading-main">
                    {!collapsed && (
                      <button
                        type="button"
                        className="icon-button dock-back-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWindows((w) => w.filter((x) => key(x) !== k));
                          if (target && key(target) === k) onSelect(null);
                          onOpen();
                        }}
                        aria-label="Volver a conversaciones"
                        title="Volver a lista de mensajes"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <Avatar name={peerName} url={peerAvatar} />
                    <button
                      type="button"
                      className="dock-title"
                      aria-expanded={!collapsed}
                      onClick={() => {
                        if (collapsed) {
                          setMinimized((m) => m.filter((x) => x !== k));
                          onSelect(t);
                        } else {
                          setMinimized((m) => [...m, k]);
                        }
                      }}
                    >
                      <div className="dock-title-text-stack">
                        <strong className="dock-peer-name">{peerName}</strong>
                        {!collapsed && caseTitle && (
                          <small className="dock-peer-sub">{caseTitle}</small>
                        )}
                      </div>
                      {i?.unread > 0 && <b className="unread-pill">{i?.unread}</b>}
                    </button>
                  </div>
                  <div className="dock-header-actions">
                    {!collapsed && (
                      <>
                        <button
                          type="button"
                          className="icon-button call-action-btn"
                          aria-label="Llamar por voz"
                          title="Llamada de voz"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(t, 'audio');
                          }}
                        >
                          <Phone size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button call-action-btn"
                          aria-label="Iniciar videollamada"
                          title="Videollamada"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(t, 'video');
                          }}
                        >
                          <Video size={16} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={collapsed ? 'Expandir conversación' : 'Minimizar conversación'}
                      title={collapsed ? 'Expandir conversación' : 'Minimizar conversación'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (collapsed) {
                          setMinimized((m) => m.filter((x) => x !== k));
                          onSelect(t);
                        } else {
                          setMinimized((m) => [...m, k]);
                        }
                      }}
                    >
                      {collapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Cerrar conversación"
                      title="Cerrar conversación"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWindows((w) => w.filter((x) => key(x) !== k));
                        if (target && key(target) === k) onSelect(null);
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </header>
                <div className="dock-body" hidden={collapsed}>
                  {!collapsed && (
                    <Conversation
                      embeddedHeader
                      target={t}
                      userId={userId}
                      initialItem={i}
                      onBack={() => {
                        setWindows((w) => w.filter((x) => key(x) !== k));
                        if (target && key(target) === k) onSelect(null);
                        onOpen();
                      }}
                      onPeerInfo={(info) => handlePeerInfo(k, info)}
                      onRead={() => void load()}
                      onCase={() => onCase(t.case_id)}
                      onStartCall={(kind, info) => startCall(t, kind, info)}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {callUi}
    </>
  );
}

function Conversation({
  target,
  userId,
  onBack,
  onRead,
  onCase,
  embeddedHeader = false,
  onPeerInfo,
  onStartCall,
  initialItem,
}: {
  target: ChatTarget;
  userId: string;
  onBack: () => void;
  onRead: () => void;
  onCase: () => void;
  embeddedHeader?: boolean;
  onPeerInfo?: (info: PeerDetail) => void;
  onStartCall?: (kind: CallKind, info?: Partial<PeerDetail>) => void;
  initialItem?: Row;
}) {
  const base = 'chats/' + target.case_id + '/' + target.lawyer_id;
  const draftKey = 'lexmarket.chat-draft.' + userId + '.' + target.case_id + '.' + target.lawyer_id;
  const [outbox, setOutbox] = useState<Row[]>(() => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(draftKey + '.outbox') || '[]');
      return Array.isArray(parsed)
        ? parsed
            .filter(Boolean)
            .map((m: Row) => ({ ...m, local_state: m.local_state === 'sent' ? 'sent' : 'failed' }))
        : [];
    } catch {
      return [];
    }
  });
  const [data, setData] = useState<Row | null>(() => {
    const saved = threadCache.get(draftKey);
    if (saved && Date.now() - saved.at < 300000) return saved.value;
    if (typeof window !== 'undefined') {
      try {
        const s = sessionStorage.getItem(draftKey + '.data');
        if (s) {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') {
            const sanitized = {
              ...parsed,
              messages: Array.isArray(parsed.messages) ? parsed.messages.filter(isRealMsg) : [],
              files: Array.isArray(parsed.files) ? parsed.files.filter(Boolean) : [],
              activity: Array.isArray(parsed.activity) ? parsed.activity.filter(Boolean) : [],
              proposals: Array.isArray(parsed.proposals) ? parsed.proposals.filter(Boolean) : [],
              peer: parsed.peer || { name: 'Conversación', avatar_url: null },
              case: parsed.case || { id: target.case_id, title: 'Caso', status: 'published' },
            };
            threadCache.set(draftKey, { value: sanitized, at: Date.now() });
            return sanitized;
          }
        }
      } catch {}
    }
    if (initialItem) {
      return {
        messages: initialItem.last
          ? [
              initialItem.last.id
                ? initialItem.last
                : { id: 'last-seed', _seed: true, ...initialItem.last },
            ]
          : [],
        files: [],
        activity: [],
        proposals: [],
        peer: initialItem.peer || { name: 'Conversación', avatar_url: null },
        peer_call_channel: initialItem.peer_call_channel || '',
        case: {
          id: initialItem.case_id,
          title: initialItem.title || 'Caso',
          status: initialItem.status || 'published',
        },
        owner: false,
        hasMore: false,
        access_state: 'granted',
      };
    }
    return null;
  });
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accessConfirm, setAccessConfirm] = useState(false);
  const [offer, setOffer] = useState(false);
  const [accept, setAccept] = useState<Row | null>(null);
  const [older, setOlder] = useState(false);
  const [tick, setTick] = useState(0);
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{
    name: string;
    url: string;
    revokeOnClose: boolean;
    fromStaged?: boolean;
  } | null>(null);

  const scroll = useRef<HTMLDivElement>(null);
  const bottom = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const latest = useRef<Row | null>(null);
  const readBusy = useRef(false);
  const active = useRef(true);
  const refreshFlight = useRef<Promise<void> | null>(null);
  const peerCallbackRef = useRef(onPeerInfo);
  const stagedUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<{ url: string; revoke: boolean } | null>(null);
  peerCallbackRef.current = onPeerInfo;

  useEffect(() => {
    return () => {
      if (stagedUrlRef.current) {
        try {
          URL.revokeObjectURL(stagedUrlRef.current);
        } catch {}
        stagedUrlRef.current = null;
      }
      if (previewUrlRef.current?.revoke) {
        try {
          URL.revokeObjectURL(previewUrlRef.current.url);
        } catch {}
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey + '.outbox', JSON.stringify(outbox));
    } catch {}
  }, [outbox, draftKey]);

  useEffect(() => {
    if (data)
      setOutbox((list) => {
        const msgs = Array.isArray(data.messages) ? data.messages : [];
        const next = list.filter((m) => !msgs.some((n: Row) => n?.id === m?.id));
        return next.length === list.length ? list : next;
      });
  }, [data]);

  useEffect(() => {
    if (data?.peer?.name) {
      peerCallbackRef.current?.({
        name: data.peer.name,
        avatar: data.peer?.avatar_url,
        caseTitle: data.case?.title,
        peerCallChannel: data.peer_call_channel,
      });
    }
  }, [data?.peer?.name, data?.peer?.avatar_url, data?.case?.title, data?.peer_call_channel]);

  async function markRead(d: Row) {
    if (
      readBusy.current ||
      document.visibilityState !== 'visible' ||
      !document.hasFocus() ||
      !bottom.current
    )
      return;
    const msgs = Array.isArray(d?.messages) ? d.messages : [];
    const ids = msgs
      .filter((m: Row) => isRealMsg(m) && m.sender_id !== userId && !m.read_at)
      .map((m: Row) => m.id)
      .slice(-60);
    if (!ids.length) return;
    readBusy.current = true;
    try {
      await api(base + '/activity', 'POST', { read_ids: ids });
      onRead();
    } catch {
    } finally {
      readBusy.current = false;
    }
  }

  useEffect(() => {
    try {
      setText(sessionStorage.getItem(draftKey) || '');
    } catch {}
  }, [draftKey]);

  const refresh = useCallback(() => {
    if (refreshFlight.current) return refreshFlight.current;
    const task = (async () => {
      try {
        const next = await api(base);
        if (!active.current) return;
        setData((prev) => {
          const prevMsgs = Array.isArray(prev?.messages) ? prev.messages.filter(isRealMsg) : [];
          const nextMsgs = Array.isArray(next?.messages) ? next.messages.filter(isRealMsg) : [];
          const map = new Map(prevMsgs.map((m: Row) => [m.id, m]));
          nextMsgs.forEach((m: Row) => map.set(m.id, m));
          const prevFiles = Array.isArray(prev?.files) ? prev.files.filter(Boolean) : [];
          const nextFiles = Array.isArray(next?.files) ? next.files.filter(Boolean) : [];
          const files = new Map(prevFiles.map((f: Row) => [f.id, f]));
          nextFiles.forEach((f: Row) => files.set(f.id, f));
          const combined = {
            ...next,
            peer: next?.peer || prev?.peer || { name: 'Conversación', avatar_url: null },
            peer_call_channel: next?.peer_call_channel || prev?.peer_call_channel || '',
            case: next?.case || prev?.case || { id: target.case_id, title: 'Caso' },
            activity: Array.isArray(next?.activity) ? next.activity : [],
            proposals: Array.isArray(next?.proposals) ? next.proposals : [],
            messages: Array.from(map.values()).sort(
              (a: any, b: any) =>
                String(a?.created_at || '').localeCompare(String(b?.created_at || '')) ||
                String(a?.id || '').localeCompare(String(b?.id || ''))
            ),
            files: Array.from(files.values()),
            hasMore: prev?.hasMore ?? next?.hasMore ?? false,
          };
          latest.current = combined;
          threadCache.delete(draftKey);
          threadCache.set(draftKey, { value: combined, at: Date.now() });
          try {
            sessionStorage.setItem(draftKey + '.data', JSON.stringify(combined));
          } catch {}
          if (threadCache.size > 20) threadCache.delete(threadCache.keys().next().value!);
          return combined;
        });
        setError('');
      } catch (e) {
        if (active.current) {
          setError((e as Error).message);
          setData(null);
          threadCache.delete(draftKey);
          try {
            sessionStorage.removeItem(draftKey + '.data');
          } catch {}
          latest.current = null;
        }
      }
    })();
    refreshFlight.current = task;
    void task.finally(() => {
      refreshFlight.current = null;
    });
    return task;
  }, [base, draftKey, target.case_id]);

  useEffect(() => {
    active.current = true;
    void refresh();
    const db = browserDB();
    const channel = db
      ? db
          .channel('thread-' + target.case_id + '-' + target.lawyer_id)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: 'case_id=eq.' + target.case_id },
            () => void refresh()
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_activity',
              filter: 'case_id=eq.' + target.case_id,
            },
            () => void refresh()
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'proposals', filter: 'case_id=eq.' + target.case_id },
            () => void refresh()
          )
          .subscribe((status) => {
            setConnected(status === 'SUBSCRIBED');
            if (status === 'SUBSCRIBED') void refresh();
          })
      : null;
    const heartbeat = () => {
      if (document.visibilityState === 'visible' && document.hasFocus())
        void api(base + '/activity', 'POST', {}).catch(() => {});
    };
    heartbeat();
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
        heartbeat();
      }
    }, 25000);
    const clock = setInterval(() => setTick((t) => t + 1), 5000);
    const focus = () => {
      heartbeat();
      void refresh();
    };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    return () => {
      active.current = false;
      clearInterval(poll);
      clearInterval(clock);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
      if (db && channel) void db.removeChannel(channel);
    };
  }, [base, refresh, target.case_id, target.lawyer_id]);

  useEffect(() => {
    if (data) {
      if (bottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
      void markRead(data);
    }
  }, [data, tick, outbox]);

  async function transmit(m: Row) {
    setOutbox((list) =>
      list.map((x) => (x.id === m.id ? { ...x, local_state: 'sending' } : x))
    );
    try {
      await api(base + '/messages', 'POST', { id: m.id, body: m.body });
      setOutbox((list) => list.map((x) => (x.id === m.id ? { ...x, local_state: 'sent' } : x)));
      window.dispatchEvent(new Event('lexmarket-update'));
      await refresh();
    } catch (e) {
      setOutbox((list) =>
        list.map((x) => (x.id === m.id ? { ...x, local_state: 'failed' } : x))
      );
      setError((e as Error).message);
    }
  }

  function clearStagedFile() {
    if (stagedUrlRef.current) {
      try {
        URL.revokeObjectURL(stagedUrlRef.current);
      } catch {}
      stagedUrlRef.current = null;
    }
    setStagedFile(null);
    setPdfPreview((cur) => (cur?.fromStaged ? null : cur));
    if (fileInput.current) fileInput.current.value = '';
  }

  function stageFile(file: File) {
    setError('');
    if (file.size > 10 * 1024 * 1024) {
      setError('El máximo por archivo es 10 MB.');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    if (stagedUrlRef.current) {
      try {
        URL.revokeObjectURL(stagedUrlRef.current);
      } catch {}
      stagedUrlRef.current = null;
    }
    const pdf = isPdfFile(file.name, file.type);
    let url: string | null = null;
    if (pdf && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        url = URL.createObjectURL(file);
        stagedUrlRef.current = url;
      } catch {}
    }
    setStagedFile({
      file,
      name: file.name,
      size: file.size,
      isPdf: pdf,
      previewUrl: url,
    });
    if (fileInput.current) fileInput.current.value = '';
  }

  async function upload(file: File): Promise<boolean> {
    setSending(true);
    setError('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('El máximo por archivo es 10 MB.');
      const f = new FormData();
      f.append('file', file);
      f.append('id', crypto.randomUUID());
      await api(base + '/files', 'POST', f);
      bottom.current = true;
      window.dispatchEvent(new Event('lexmarket-update'));
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSending(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function send() {
    const trimmed = text.trim();
    const fileToSend = stagedFile;
    if (!trimmed && !fileToSend) return;

    if (fileToSend) {
      const ok = await upload(fileToSend.file);
      if (ok) {
        clearStagedFile();
      }
    }

    if (trimmed) {
      const m = {
        id: crypto.randomUUID(),
        body: trimmed,
        sender_id: userId,
        created_at: new Date().toISOString(),
        local_state: 'sending',
      };
      setOutbox((list) => [...list, m]);
      setText('');
      setError('');
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      bottom.current = true;
      void transmit(m);
    }
  }

  function closePdfPreview() {
    if (pdfPreview?.revokeOnClose) {
      try {
        URL.revokeObjectURL(pdfPreview.url);
      } catch {}
      previewUrlRef.current = null;
    }
    setPdfPreview(null);
  }

  async function openRemotePdf(f: Row) {
    try {
      const db = browserDB();
      if (!db) throw new Error('Servicio no disponible.');
      const { data: s } = await db.auth.getSession();
      const r = await fetch('/api/chat-files/' + f.id, {
        headers: { Authorization: 'Bearer ' + s.session?.access_token },
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const rawBlob = await r.blob();
      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const u = URL.createObjectURL(pdfBlob);
      if (previewUrlRef.current?.revoke) {
        try {
          URL.revokeObjectURL(previewUrlRef.current.url);
        } catch {}
      }
      previewUrlRef.current = { url: u, revoke: true };
      setPdfPreview({ name: f.name || 'Documento.pdf', url: u, revokeOnClose: true });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function download(f: Row) {
    try {
      const db = browserDB();
      if (!db) throw new Error('Servicio no disponible.');
      const { data: s } = await db.auth.getSession();
      const r = await fetch('/api/chat-files/' + f.id, {
        headers: { Authorization: 'Bearer ' + s.session?.access_token },
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const u = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = u;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadOlder() {
    const msgs = Array.isArray(data?.messages) ? data.messages : [];
    if (!msgs.length || !msgs[0]?.created_at) return;
    setOlder(true);
    const height = scroll.current?.scrollHeight || 0;
    try {
      const d = await api(base + '?before=' + encodeURIComponent(msgs[0].created_at));
      setData((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...(Array.isArray(d?.messages) ? d.messages : []),
                ...(Array.isArray(prev.messages) ? prev.messages : []).filter(
                  (m: Row) =>
                    !(Array.isArray(d?.messages) ? d.messages : []).some((n: Row) => n?.id === m?.id)
                ),
              ],
              files: [
                ...(Array.isArray(d?.files) ? d.files : []),
                ...(Array.isArray(prev.files) ? prev.files : []),
              ],
              hasMore: Boolean(d?.hasMore),
            }
          : prev
      );
      requestAnimationFrame(() => {
        if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight - height;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOlder(false);
    }
  }

  const safeMessages: Row[] = Array.isArray(data?.messages) ? data.messages.filter(Boolean) : [];
  const safeFiles: Row[] = Array.isArray(data?.files) ? data.files.filter(Boolean) : [];
  const safeProposals: Row[] = Array.isArray(data?.proposals) ? data.proposals.filter(Boolean) : [];
  const safeActivity: Row[] = Array.isArray(data?.activity) ? data.activity.filter(Boolean) : [];
  const peerActivity = safeActivity.find((a: Row) => a.user_id !== userId);
  const online =
    peerActivity &&
    peerActivity.last_seen_at &&
    Date.now() - new Date(peerActivity.last_seen_at).getTime() < 65000;
  const typing =
    peerActivity?.typing_until && new Date(peerActivity.typing_until).getTime() > Date.now();

  const triggerCall = (kind: CallKind) => {
    onStartCall?.(kind, {
      name: data?.peer?.name,
      avatar: data?.peer?.avatar_url,
      caseTitle: data?.case?.title,
      peerCallChannel: data?.peer_call_channel,
    });
  };

  return (
    <div className="conversation">
      {!embeddedHeader ? (
        <header className="conversation-peer">
          <button
            className="icon-button"
            onClick={onBack}
            aria-label="Volver a conversaciones"
          >
            <ArrowLeft size={18} />
          </button>
          {data && (
            <>
              <Avatar name={data.peer?.name || 'Conversación'} url={data.peer?.avatar_url} />
              <div>
                <b>{data.peer?.name || 'Conversación'}</b>
                <small>
                  {typing
                    ? 'Está escribiendo…'
                    : online
                    ? 'En esta conversación'
                    : peerActivity?.last_seen_at
                    ? 'Última actividad: ' + date(peerActivity.last_seen_at)
                    : 'Aún no se ha conectado al chat'}
                </small>
              </div>
              {onStartCall && (
                <div className="conversation-peer-actions">
                  <button
                    type="button"
                    className="icon-button call-action-btn"
                    onClick={() => triggerCall('audio')}
                    aria-label="Llamar por voz"
                    title="Llamada de voz"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-button call-action-btn"
                    onClick={() => triggerCall('video')}
                    aria-label="Iniciar videollamada"
                    title="Videollamada"
                  >
                    <Video size={19} />
                  </button>
                </div>
              )}
            </>
          )}
        </header>
      ) : null}
      {data && (
        <button className="chat-case-link" onClick={onCase}>
          <FileText size={14} />
          <span>{data.case?.title || 'Ver caso'}</span>
          <span>Ver caso ↗</span>
        </button>
      )}
      {!connected && (
        <p className="chat-network" role="status">
          Conectando en tiempo real… Actualizamos también al reconectar.
        </p>
      )}
      {error && (
        <div className="chat-error" role="alert">
          {error}
          <button onClick={() => void refresh()}>Reintentar</button>
        </div>
      )}
      <div
        className="chat-timeline"
        ref={scroll}
        onScroll={() => {
          const e = scroll.current!;
          bottom.current = e.scrollHeight - e.scrollTop - e.clientHeight < 45;
          if (bottom.current && latest.current) void markRead(latest.current);
        }}
      >
        {!data && !error && (
          <div className="chat-loading" role="status">
            <span>Cargando conversación…</span>
            <i />
            <i />
            <i />
          </div>
        )}
        {data?.hasMore && (
          <button className="text-button" disabled={older} onClick={() => void loadOlder()}>
            {older ? 'Cargando…' : 'Ver mensajes anteriores'}
          </button>
        )}
        {data?.access_state === 'requested' && (
          <div className="chat-access-card">
            <b>Conversemos antes de compartir el expediente</b>
            <p>{data.case?.summary || ''}</p>
            {data.owner ? (
              <>
                <p>
                  Este profesional solicita revisar tus documentos privados. Conversar no le da
                  acceso.
                </p>
                <button className="button small" onClick={() => setAccessConfirm(true)}>
                  Revisar acceso
                </button>
              </>
            ) : (
              <p>Puedes preguntar al cliente mientras autoriza el acceso al expediente.</p>
            )}
          </div>
        )}
        {data && (
          <p className="chat-privacy">
            <ShieldCheck size={14} /> Solo tú y{' '}
            {(data.peer?.name || 'el abogado').trim().split(/\s+/)[0]} pueden ver esta conversación
            y sus adjuntos.
          </p>
        )}
        {data &&
          [
            ...outbox
              .filter((m) => !safeMessages.some((n: Row) => n.id === m.id))
              .map((m) => ({ ...m, kind: 'message' })),
            ...safeMessages.map((m: Row) => ({ ...m, kind: 'message' })),
            ...safeProposals.map((p: Row) => ({ ...p, kind: 'proposal' })),
          ]
            .sort(
              (a: Row, b: Row) =>
                String(a?.created_at || '').localeCompare(String(b?.created_at || '')) ||
                String(a?.id || '').localeCompare(String(b?.id || ''))
            )
            .map((m: Row, idx: number) =>
              m.kind === 'proposal' ? (
                <article className="chat-offer" key={m.id || 'prop-' + idx}>
                  <span className="overline">PROPUESTA DE ACOMPAÑAMIENTO</span>
                  <h3>
                    {money(m.amount)} <small>COP</small>
                  </h3>
                  <p className="preserve">{m.scope}</p>
                  <details>
                    <summary>Alcance y condiciones</summary>
                    <p>
                      <b>No incluye:</b> {m.exclusions}
                    </p>
                    <p>
                      <b>Forma de pago:</b> {m.payment_terms}
                    </p>
                    <p>{m.days} días de trabajo estimados desde el inicio acordado.</p>
                  </details>
                  <small>
                    {date(m.created_at)} ·{' '}
                    {m.status === 'accepted'
                      ? 'Elegida'
                      : m.status === 'declined'
                      ? 'Cerrada / reemplazada'
                      : 'Por revisar'}
                  </small>
                  {data.owner && m.status === 'pending' && data.case?.status === 'published' && (
                    <button className="button small" onClick={() => setAccept(m)}>
                      Revisar y elegir
                    </button>
                  )}
                </article>
              ) : (
                <article
                  className={'chat-bubble ' + (m.sender_id === userId ? 'outgoing' : 'incoming')}
                  key={m.id || m.created_at || 'msg-' + idx}
                >
                  {m.attachment_id ? (
                    (() => {
                      const f = safeFiles.find((file: Row) => file.id === m.attachment_id);
                      if (!f) return <span>Documento no disponible</span>;
                      const pdf = isPdfFile(f.name, f.mime);
                      return (
                        <div className="chat-file-card">
                          <button className="chat-file" onClick={() => void download(f)}>
                            <FileText size={24} />
                            <span>
                              <b>{f.name}</b>
                              <small>{formatSize(f.size)} · Descargar</small>
                            </span>
                            <Download size={17} />
                          </button>
                          {pdf && (
                            <button
                              type="button"
                              className="chat-file-preview-btn"
                              onClick={() => void openRemotePdf(f)}
                            >
                              <Eye size={13} />
                              <span>Ver PDF</span>
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p>{m.body}</p>
                  )}
                  <footer>
                    <time title={date(m.created_at)}>{time(m.created_at)}</time>
                    {m.sender_id === userId && (
                      <span
                        className={m.read_at ? 'read' : ''}
                        title={
                          m.read_at
                            ? 'Leído ' + date(m.read_at)
                            : m.delivered_at
                            ? 'Entregado ' + date(m.delivered_at)
                            : 'Guardado en el servidor'
                        }
                      >
                        {m.local_state === 'sending' || m.local_state === 'failed' ? null : m.read_at ||
                          m.delivered_at ? (
                          <CheckCheck size={13} />
                        ) : (
                          <Check size={13} />
                        )}{' '}
                        {m.local_state === 'sending'
                          ? 'Enviando…'
                          : m.local_state === 'failed'
                          ? 'No enviado'
                          : m.read_at
                          ? 'Leído'
                          : m.delivered_at
                          ? 'Entregado'
                          : 'Enviado'}
                      </span>
                    )}
                  </footer>
                  {m.local_state === 'failed' && (
                    <button className="retry-message" onClick={() => void transmit(m)}>
                      Reintentar envío
                    </button>
                  )}
                </article>
              )
            )}
        {data && !outbox.length && !safeMessages.length && !safeProposals.length && (
          <div className="chat-empty">
            <h3>Un saludo abre el camino.</h3>
            <p>Hablen de lo que necesitan revisar, los tiempos y cómo les gustaría trabajar.</p>
          </div>
        )}
      </div>
      {data && (
        <div className="chat-compose-area">
          {!data.owner && data.access_state === 'granted' && data.case?.status === 'published' && (
            <button className="text-button" onClick={() => setOffer(true)}>
              + Proponer honorarios y alcance
            </button>
          )}
          {stagedFile && (
            <div className="chat-staged-file" aria-label="Archivo listo para enviar">
              <div className="chat-staged-file-head">
                <div className="chat-staged-file-meta">
                  <FileText size={16} />
                  <div>
                    <strong title={stagedFile.name}>{stagedFile.name}</strong>
                    <small>{formatSize(stagedFile.size)} · Listo para enviar</small>
                  </div>
                </div>
                <div className="chat-staged-file-actions">
                  {stagedFile.isPdf && stagedFile.previewUrl && (
                    <button
                      type="button"
                      className="chat-staged-action"
                      onClick={() =>
                        setPdfPreview({
                          name: stagedFile.name,
                          url: stagedFile.previewUrl!,
                          revokeOnClose: false,
                          fromStaged: true,
                        })
                      }
                      aria-label="Ampliar vista previa del PDF"
                      title="Ver PDF en pantalla completa"
                    >
                      <Eye size={14} />
                      <span>Ampliar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-button chat-staged-remove"
                    onClick={clearStagedFile}
                    disabled={sending}
                    aria-label="Quitar archivo adjunto"
                    title="Quitar archivo"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              {stagedFile.isPdf && stagedFile.previewUrl && (
                <div className="chat-staged-pdf-wrap">
                  <iframe
                    src={stagedFile.previewUrl + '#toolbar=0&navpanes=0'}
                    className="chat-staged-pdf-frame"
                    title={'Vista previa de ' + stagedFile.name}
                  />
                </div>
              )}
            </div>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              hidden
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) stageFile(f);
              }}
            />
            <button
              type="button"
              className="icon-button"
              disabled={sending}
              onClick={() => fileInput.current?.click()}
              aria-label="Adjuntar documento PDF, DOCX o TXT"
              title="Adjuntar documento PDF, DOCX o TXT"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              value={text}
              rows={2}
              maxLength={4000}
              aria-label="Escribe un mensaje"
              placeholder={
                stagedFile ? 'Agrega un comentario opcional o envía el archivo…' : 'Escribe con confianza…'
              }
              onChange={(e) => {
                setText(e.target.value);
                try {
                  sessionStorage.setItem(draftKey, e.target.value);
                } catch {}
                if (Date.now() - lastTyping.current > 4000) {
                  lastTyping.current = Date.now();
                  void api(base + '/activity', 'POST', { typing: true }).catch(() => {});
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              className="chat-send"
              disabled={sending || (!text.trim() && !stagedFile)}
              aria-label="Enviar mensaje"
            >
              <Send size={19} />
            </button>
          </form>
          <small>
            {sending
              ? 'Enviando…'
              : stagedFile
              ? 'Revisa tu archivo antes de enviarlo · Presiona Enviar cuando estés listo'
              : 'PDF, DOCX o TXT · Hasta 10 MB · Mayús + Enter para otra línea'}
          </small>
        </div>
      )}
      {pdfPreview && (
        <div
          className="pdf-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={'Vista previa de ' + pdfPreview.name}
          onClick={closePdfPreview}
        >
          <div className="pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <header className="pdf-preview-header">
              <div className="pdf-preview-title">
                <FileText size={18} />
                <strong>{pdfPreview.name}</strong>
              </div>
              <div className="pdf-preview-actions">
                {pdfPreview.fromStaged && stagedFile && (
                  <button
                    type="button"
                    className="button small"
                    disabled={sending}
                    onClick={() => void send()}
                  >
                    <Send size={14} />
                    <span>{sending ? 'Enviando…' : 'Enviar PDF'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="icon-button"
                  onClick={closePdfPreview}
                  aria-label="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </header>
            <iframe
              src={pdfPreview.url}
              className="pdf-preview-full-frame"
              title={'Documento ' + pdfPreview.name}
            />
          </div>
        </div>
      )}
      {accessConfirm && (
        <Modal
          title="¿Compartir el expediente con este profesional?"
          onClose={() => setAccessConfirm(false)}
        >
          <p>
            Podrá leer los hechos privados y descargar los documentos del caso. Autorizar acceso no
            equivale a contratar.
          </p>
          <button
            className="button"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              try {
                await api('cases/' + target.case_id + '/access', 'PATCH', {
                  lawyer_id: target.lawyer_id,
                  state: 'granted',
                });
                setAccessConfirm(false);
                window.dispatchEvent(new Event('lexmarket-update'));
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSending(false);
              }
            }}
          >
            Autorizar acceso
          </button>
          <button
            className="button outline"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              try {
                await api('cases/' + target.case_id + '/access', 'PATCH', {
                  lawyer_id: target.lawyer_id,
                  state: 'revoked',
                });
                setAccessConfirm(false);
                window.dispatchEvent(new Event('lexmarket-update'));
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSending(false);
              }
            }}
          >
            Rechazar solicitud
          </button>
        </Modal>
      )}
      {offer && (
        <Modal title="Dejemos el acuerdo claro" onClose={() => setOffer(false)}>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setSending(true);
              try {
                await api('cases/' + target.case_id + '/proposals', 'POST', {
                  ...Object.fromEntries(f),
                  amount: Number(f.get('amount')),
                  days: Number(f.get('days')),
                });
                setOffer(false);
                bottom.current = true;
                await refresh();
              } catch (e) {
                setError((e as Error).message);
                setOffer(false);
              } finally {
                setSending(false);
              }
            }}
          >
            <Field label="Qué vas a hacer y entregar">
              <textarea name="scope" required minLength={30} maxLength={4000} />
            </Field>
            <Field label="Qué no está incluido">
              <textarea name="exclusions" required minLength={5} maxLength={2000} />
            </Field>
            <div className="form-grid">
              <Field label="Honorarios (COP)">
                <input name="amount" type="number" required min={0} max={1000000000} />
              </Field>
              <Field label="Días de trabajo estimados">
                <input name="days" type="number" required min={1} max={365} />
              </Field>
            </div>
            <Field label="Forma de pago, impuestos y gastos">
              <textarea name="payment_terms" required minLength={5} maxLength={1000} />
            </Field>
            <p className="microcopy">
              Una nueva propuesta reemplaza la anterior pendiente y conserva su historial. El pago
              se acuerda directamente entre ustedes.
            </p>
            <button className="button" disabled={sending}>
              Enviar propuesta
            </button>
          </form>
        </Modal>
      )}
      {accept && (
        <Modal title="¿Avanzamos con esta propuesta?" onClose={() => setAccept(null)}>
          <h3>{money(accept.amount)}</h3>
          <p>{accept.scope}</p>
          <p>
            Al elegirla se cierran las demás propuestas y se retira el acceso de otros profesionales.
            No se realiza un pago ni se presentan documentos.
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setSending(true);
              try {
                await api('cases/' + target.case_id + '/accept', 'POST', {
                  proposal_id: accept.id,
                  understood: true,
                });
                setAccept(null);
                await refresh();
              } catch (e) {
                setError((e as Error).message);
                setAccept(null);
              } finally {
                setSending(false);
              }
            }}
          >
            <label className="checkbox-line">
              <input type="checkbox" required />
              Revisé las condiciones. Confirmaré el encargo y el poder que corresponda con el
              abogado.
            </label>
            <button className="button" disabled={sending}>
              Elegir y continuar
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
