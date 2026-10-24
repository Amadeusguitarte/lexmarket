'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RotateCcw, X, Minimize2, Maximize2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface MatchAssistantChatProps {
  mode?: 'card' | 'floating';
  title?: string;
  subtitle?: string;
  chips?: string[];
  userRole?: 'client' | 'lawyer';
  onClose?: () => void;
  className?: string;
}

const DEFAULT_CLIENT_CHIPS = [
  '¿Qué documentos necesito para mi caso?',
  '¿Cómo evalúo las propuestas de los abogados?',
  '¿Cómo funciona el pago protegido?',
  '¿Qué plazos legales aplican en Colombia?'
];

const DEFAULT_LAWYER_CHIPS = [
  'Estructurar propuesta de honorarios',
  'Términos procesales CGP / CPACA',
  'Borrador de poder y alcance de encargo',
  'Revisar caso y estrategia procesal'
];

export default function MatchAssistantChat({
  mode = 'card',
  title = '¿Tienes dudas jurídicas o sobre tu caso?',
  subtitle = 'Te oriento sobre leyes colombianas, trámites y evaluación de propuestas.',
  chips,
  userRole = 'client',
  onClose,
  className = ''
}: MatchAssistantChatProps) {
  const isClient = userRole === 'client';
  const effectiveChips = chips && chips.length > 0 
    ? chips 
    : (isClient ? DEFAULT_CLIENT_CHIPS : DEFAULT_LAWYER_CHIPS);

  const initialWelcomeText = isClient
    ? '¡Hola! Soy **MatchAsistente**, tu copiloto de inteligencia jurídica en **MatchJurídico**.\n\nEstoy aquí para guiarte en lenguaje claro sobre cómo funciona la justicia en Colombia, tus derechos, trámites (como tutelas, derechos de petición o demandas) y cómo revisar con calma las propuestas de los abogados.\n\n¿En qué te puedo orientar hoy?'
    : 'Hola, colega. Soy **MatchAsistente**, tu copiloto de inteligencia jurídica especializado en el marco normativo colombiano (CGP, CST, CPACA, Código Civil y Comercial).\n\n¿En qué consulta procesal, estrategia de honorarios o análisis de caso requieres apoyo técnico hoy?';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: initialWelcomeText,
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: q,
      createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Send conversation history up to last 8 messages
      const apiHistory = nextMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          history: apiHistory,
          context: { role: userRole }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || 'No se obtuvo respuesta del asistente.';
        setMessages(prev => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            role: 'assistant',
            content: reply,
            createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('API error');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: 'En este momento no pude conectar con el servicio de asistencia. Por favor verifica tu conexión o compara los perfiles de los abogados en el directorio de MatchJurídico.',
          createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        role: 'assistant',
        content: initialWelcomeText,
        createdAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput('');
  };

  const renderFormattedText = (content: string) => {
    // Format bold text **text** and paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      return (
        <p key={pIdx} className="assistant-para">
          {lines.map((line, lIdx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <span key={lIdx}>
                {lIdx > 0 && <br />}
                {parts.map((part, partIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </span>
            );
          })}
        </p>
      );
    });
  };

  const isCard = mode === 'card';

  return (
    <div
      className={`match-assistant-card ${isCard ? 'match-assistant-card-chat' : 'match-assistant-floating-window'} ${className}`}
      id={isCard ? 'match-asistente-box' : undefined}
      aria-label="Asistente de MatchJurídico"
    >
      {/* Header */}
      <div className="assistant-chat-header">
        <div className="assistant-brand-badge">
          <div className="assistant-avatar-pill">
            <Sparkles size={16} className="coral-icon" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="assistant-name">MatchAsistente</span>
              <span className="assistant-card-badge">Inteligencia Jurídica</span>
            </div>
            {!isCard && (
              <span className="assistant-floating-subtitle">
                Copiloto con IA para Colombia
              </span>
            )}
          </div>
        </div>

        <div className="assistant-header-actions">
          <button
            type="button"
            className="assistant-header-btn"
            onClick={handleReset}
            title="Nueva consulta (limpiar chat)"
            aria-label="Nueva consulta"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline text-[11px]">Reiniciar</span>
          </button>
          {!isCard && onClose && (
            <button
              type="button"
              className="assistant-header-btn close-btn"
              onClick={onClose}
              title="Cerrar ventana"
              aria-label="Cerrar chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {isCard && title && messages.length <= 1 && (
        <div className="assistant-card-lead">
          <h4 className="assistant-title">{title}</h4>
          {subtitle && <p className="assistant-sub">{subtitle}</p>}
        </div>
      )}

      {/* Chronological Chat Timeline */}
      <div className="assistant-chat-timeline" ref={timelineRef}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`assistant-chat-row ${isUser ? 'user-row' : 'bot-row'}`}
            >
              {!isUser && (
                <div className="bot-avatar-circle" aria-hidden="true">
                  <Sparkles size={14} />
                </div>
              )}
              <div className={`assistant-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                <div className="assistant-bubble-body">
                  {renderFormattedText(msg.content)}
                </div>
                <div className="assistant-bubble-footer">
                  <span className="assistant-time">{msg.createdAt}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Suggestion Chips (show when only welcome message is present) */}
        {messages.length <= 1 && effectiveChips.length > 0 && (
          <div className="assistant-chips-container">
            <span className="assistant-chips-label">Sugerencias rápidas:</span>
            <div className="assistant-chips-grid">
              {effectiveChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="assistant-chip-btn"
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                >
                  <span>{chip}</span>
                  <ArrowRight size={12} className="chip-arrow" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="assistant-chat-row bot-row typing-row">
            <div className="bot-avatar-circle" aria-hidden="true">
              <Sparkles size={14} />
            </div>
            <div className="assistant-bubble bot-bubble typing-bubble">
              <div className="assistant-typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="typing-text">MatchAsistente está analizando tu consulta...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input Composer */}
      <form
        className="assistant-composer-form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          className="assistant-composer-input"
          placeholder="Escribe tu consulta jurídica aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus={!isCard}
        />
        <button
          type="submit"
          className="assistant-composer-send-btn"
          disabled={loading || !input.trim()}
          aria-label="Enviar mensaje a MatchAsistente"
          title="Enviar"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
