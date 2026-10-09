'use client';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Sparkles,
  Upload,
  MessageSquare,
  Shield,
  Users,
  EyeOff,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';

interface NarrativeStepProps {
  initialNarrative: string;
  onChange?: (narrative: string) => void;
  onContinue: (narrative: string) => void;
  onSaveAndExit: () => void;
  onImportDocument?: (file: File) => void;
  busy?: boolean;
}

export default function NarrativeStep({
  initialNarrative,
  onChange,
  onContinue,
  onSaveAndExit,
  onImportDocument,
  busy = false
}: NarrativeStepProps) {
  const [text, setText] = useState(initialNarrative);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [dictationNotice, setDictationNotice] = useState('');
  const [dictationError, setDictationError] = useState('');
  const [attachedCount, setAttachedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up any active speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    setDictationNotice('');
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDictationError(
        'Tu navegador actual no tiene activado el dictado por voz nativo. Puedes usar Google Chrome, Microsoft Edge o escribir tu caso aquí directamente.'
      );
      return;
    }

    try {
      // Abort any old session
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CO';
      recognition.maxAlternatives = 1;

      setDictationError('');
      setDictationNotice('Escuchando... habla y tu voz se escribirá aquí');
      setIsListening(true);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk.trim()) {
          setText((prev) => {
            const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            const next = prev + separator + finalChunk.trim();
            onChange?.(next);
            return next;
          });
          setInterimText('');
        } else if (interimChunk) {
          setInterimText(interimChunk);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === 'not-allowed') {
          setDictationError(
            'Permiso de micrófono bloqueado. Activa el acceso al micrófono en los ajustes de tu navegador para poder dictar.'
          );
        } else if (err === 'no-speech') {
          setDictationNotice('No se detectó sonido. Vuelve a pulsar Dictar cuando quieras hablar.');
        } else if (err === 'network') {
          setDictationError('Se requiere conexión a internet para el reconocimiento de voz.');
        } else if (err !== 'aborted') {
          setDictationError(`Aviso de dictado (${err}). Puedes continuar escribiendo con normalidad.`);
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setDictationError('No fue posible iniciar el micrófono. Puedes redactar tu caso aquí directamente.');
    }
  };

  const handleDocumentPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt')) {
      const content = await file.text();
      setText((prev) => (prev ? prev + '\n\n' + content : content));
    } else if (onImportDocument) {
      onImportDocument(file);
      setAttachedCount((c) => c + 1);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (clean.length < 20) {
      setError('Cuéntanos un poco más para que podamos entender tu caso (al menos unas 2 líneas).');
      return;
    }
    setError('');
    onContinue(clean);
  };

  const samplePrompts = [
    {
      short: 'Mi empleador me despidió la semana pasada...',
      full: 'Mi empleador me despidió la semana pasada después de haber presentado una incapacidad médica. No me han pagado la liquidación y quiero entender qué opciones tengo.'
    },
    {
      short: 'Quiero solicitar cuota de alimentos para mi hijo...',
      full: 'Quiero solicitar cuota de alimentos para mi hijo menor de edad y fijar visitas, ya que no hemos podido conciliar amistosamente.'
    },
    {
      short: 'Tengo un contrato de arrendamiento y el inquilino...',
      full: 'Tengo un contrato de arrendamiento y el inquilino lleva 3 meses sin pagar el canon de arriendo. Necesito iniciar la restitución del inmueble.'
    }
  ];

  return (
    <div className="narrative-screen-layout">
      {/* Left Contextual Sidebar */}
      <aside className="narrative-sidebar">
        <div className="narrative-step-badge">
          <span>PASO 1 DE 5</span>
          <div className="narrative-badge-underline" />
        </div>

        <h2 className="narrative-sidebar-title">
          En tus<br />palabras.
        </h2>
        <p className="narrative-sidebar-sub">
          Lo importante es entender lo que pasó y qué necesitas resolver.
        </p>

        <div className="narrative-desk-image-wrap">
          <img
            src="/intake-situation-desk.png"
            alt="Mesa de trabajo y códigos jurídicos MatchJurídico"
            className="narrative-desk-img"
          />
        </div>

        <div className="narrative-sidebar-points">
          <div className="narrative-point-row">
            <div className="narrative-point-icon">
              <MessageSquare size={17} />
            </div>
            <div className="narrative-point-text">
              <strong>Sin lenguaje técnico</strong>
              <span>Puedes escribir como hablas.</span>
            </div>
          </div>

          <div className="narrative-point-row">
            <div className="narrative-point-icon">
              <Shield size={17} />
            </div>
            <div className="narrative-point-text">
              <strong>Tú tienes el control</strong>
              <span>Decides qué compartir y cuándo.</span>
            </div>
          </div>

          <div className="narrative-point-row">
            <div className="narrative-point-icon">
              <Users size={17} />
            </div>
            <div className="narrative-point-text">
              <strong>Personas reales</strong>
              <span>Te conectamos con abogados verificados.</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Interactive Work Area */}
      <main className="narrative-main-workarea">
        <div className="narrative-workspace-grid">
          {/* Main Form (Left column of the right side) */}
          <div className="narrative-form-col">
            <div className="narrative-header-block">
              <h1 className="narrative-main-headline">Cuéntanos qué está pasando.</h1>
              <p className="narrative-main-subcopy">
                Escríbelo como se lo contarías a alguien de confianza. Empieza con lo que sabes; luego podrás completar o ajustar la información.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Textarea Card */}
              <div className="narrative-input-card">
                <div className="narrative-card-topbar">
                  <label htmlFor="narrative-input" className="narrative-card-label">
                    ¿Qué ocurrió y qué te gustaría resolver?
                  </label>

                  <button
                    type="button"
                    className={`narrative-dictate-pill ${isListening ? 'active-listening' : ''}`}
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Detener dictado' : 'Dictar por voz'}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    <span>{isListening ? 'Detener dictado' : 'Dictar'}</span>
                  </button>
                </div>

                {isListening && (
                  <div className="dictation-live-bar" role="status">
                    <span className="live-mic-pulse" />
                    <span className="live-status-text">
                      {interimText ? (
                        <span className="interim-text">&ldquo;{interimText}&rdquo;</span>
                      ) : (
                        dictationNotice || 'Escuchando... habla con tranquilidad, estamos transcribiendo'
                      )}
                    </span>
                    <button
                      type="button"
                      className="stop-dictate-inline-btn"
                      onClick={stopVoiceInput}
                    >
                      Listo
                    </button>
                  </div>
                )}

                {dictationNotice && !isListening && (
                  <div className="dictation-notice-hint">
                    <span>{dictationNotice}</span>
                  </div>
                )}

                {dictationError && (
                  <div className="dictation-error-hint" role="alert">
                    <AlertCircle size={14} className="error-icon" />
                    <span className="error-msg">{dictationError}</span>
                    <button
                      type="button"
                      className="dismiss-hint-btn"
                      onClick={() => setDictationError('')}
                      aria-label="Cerrar aviso"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <textarea
                  id="narrative-input"
                  className="narrative-clean-textarea"
                  rows={6}
                  placeholder="Por ejemplo: Mi empleador me despidió la semana pasada después de haber presentado una incapacidad médica. No me han pagado la liquidación y quiero entender qué opciones tengo..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    onChange?.(e.target.value);
                    if (error) setError('');
                  }}
                />

                <div className="narrative-card-bottombar">
                  <span className="narrative-char-counter">
                    {text.length} caracteres
                  </span>
                </div>
              </div>

              {/* Inspiration Samples */}
              <div className="narrative-samples-section">
                <span className="narrative-samples-label">
                  O pulsa un ejemplo para empezar:
                </span>
                <div className="narrative-samples-pills">
                  {samplePrompts.map((p) => (
                    <button
                      key={p.short}
                      type="button"
                      className="narrative-sample-pill"
                      onClick={() => {
                        setText(p.full);
                        onChange?.(p.full);
                      }}
                    >
                      <Sparkles size={13} className="sample-sparkle" />
                      <span>{p.short}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Document Upload Option */}
              <div className="narrative-docs-secondary-section">
                <button
                  type="button"
                  className="narrative-docs-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} />
                  <span>
                    {attachedCount > 0
                      ? `${attachedCount} documento(s) adjunto(s) · Añadir más`
                      : 'Adjunta los documentos que tengas preparados'}
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept=".txt,.docx,.pdf,.png,.jpg,.jpeg"
                  onChange={handleDocumentPick}
                />
                <p className="narrative-docs-hint">
                  Si todavía no los tienes a la mano, puedes continuar y subirlos después.<br />
                  Por ejemplo: contratos, cartas, correos, facturas o cualquier documento relevante.
                </p>
              </div>

              {error && (
                <div className="intake-field-error" role="alert">
                  {error}
                </div>
              )}

              {/* Bottom Actions Row */}
              <div className="narrative-actions-row">
                <button
                  type="button"
                  className="narrative-save-exit-btn"
                  onClick={onSaveAndExit}
                  disabled={busy}
                >
                  Guardar y salir
                </button>

                <button
                  type="submit"
                  className="narrative-continue-cta"
                  disabled={busy}
                >
                  <span>{busy ? 'Entendiendo tu situación…' : 'Continuar'}</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Aside: "Bajo tu control" Card */}
          <div className="narrative-control-card">
            <div className="narrative-control-icon-circle">
              <Shield size={19} />
            </div>

            <h3 className="narrative-control-title">Bajo tu control</h3>
            <p className="narrative-control-subtitle">
              Tu información está segura y tú decides qué compartir.
            </p>

            <div className="narrative-control-bullets">
              <div className="narrative-control-bullet-row">
                <div className="control-bullet-icon">
                  <EyeOff size={16} />
                </div>
                <p>Puedes omitir nombres o teléfonos por ahora.</p>
              </div>

              <div className="narrative-control-bullet-row">
                <div className="control-bullet-icon">
                  <Users size={16} />
                </div>
                <p>Los abogados no ven tu caso hasta que lo revises y decidas compartirlo.</p>
              </div>

              <div className="narrative-control-bullet-row">
                <div className="control-bullet-icon">
                  <FileText size={16} />
                </div>
                <p>Puedes subir documentos cuando los tengas.</p>
              </div>
            </div>

            <div className="narrative-control-footer-note">
              <p>
                Adjunta los documentos que tengas preparados. Si todavía no los tienes a la mano, puedes continuar y subirlos después.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
