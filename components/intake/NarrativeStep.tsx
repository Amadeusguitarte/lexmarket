'use client';
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Mic, MicOff, Lock, Sparkles, FileText, Upload } from 'lucide-react';

interface NarrativeStepProps {
  initialNarrative: string;
  onContinue: (narrative: string) => void;
  onSaveAndExit: () => void;
  onImportDocument?: (file: File) => void;
  busy?: boolean;
}

export default function NarrativeStep({
  initialNarrative,
  onContinue,
  onSaveAndExit,
  onImportDocument,
  busy = false
}: NarrativeStepProps) {
  const [text, setText] = useState(initialNarrative);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Speech recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CO';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + transcript;
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta entrada de voz. Puedes escribir o pegar tu relato directamente.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
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
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (clean.length < 25) {
      setError('Cuéntanos un poco más para que podamos entender tu caso (al menos unas 2 o 3 líneas).');
      return;
    }
    setError('');
    onContinue(clean);
  };

  const samplePrompts = [
    'Mi empleador me despidió la semana pasada sin justa causa...',
    'Quiero solicitar la cuota de alimentos para mi hijo...',
    'Tengo un contrato de arrendamiento y el inquilino no ha pagado...',
    'Compré un producto y el establecimiento no quiere aplicar la garantía...'
  ];

  return (
    <div className="intake-step narrative-step">
      <div className="step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> PASO 1 · TU SITUACIÓN
        </span>
        <h1 className="editorial-headline">Cuéntanos qué está pasando.</h1>
        <p className="step-sub">
          Escríbelo como se lo contarías a alguien de confianza. No necesitas saber de leyes ni identificar qué tipo de abogado necesitas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="narrative-form">
        <div className="narrative-textarea-wrapper">
          <div className="textarea-top-toolbar">
            <label htmlFor="narrative-input" className="textarea-label">
              ¿Qué ocurrió y qué te gustaría resolver?
            </label>
            <div className="voice-action-wrapper">
              <button
                type="button"
                className={`voice-record-btn ${isListening ? 'active' : ''}`}
                onClick={toggleVoiceInput}
                title={isListening ? 'Detener dictado' : 'Dictar por voz'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isListening ? 'Escuchando…' : 'Dictar por voz'}</span>
              </button>
            </div>
          </div>

          <textarea
            id="narrative-input"
            rows={7}
            className="editorial-textarea"
            placeholder="Por ejemplo: Mi empleador me despidió la semana pasada después de haber presentado una incapacidad médica. No me han pagado la liquidación y quiero entender qué opciones tengo..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError('');
            }}
          />

          <div className="privacy-helper-banner">
            <Lock size={15} className="privacy-icon" />
            <p>
              <strong>Privacidad primero:</strong> No incluyas nombres completos, números de cédula ni teléfonos que prefieras mantener privados. Podrás añadirlos de forma segura más adelante.
            </p>
          </div>
        </div>

        {/* Secondary options: paste samples or import text document */}
        <div className="narrative-secondary-bar">
          <div className="secondary-import-options">
            <button
              type="button"
              className="text-pill-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Ya tengo un escrito o notas (.txt, .docx)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept=".txt,.docx,.pdf"
              onChange={handleDocumentPick}
            />
          </div>

          <span className="char-count">{text.length} caracteres</span>
        </div>

        {/* Sample inspiration prompts */}
        {!text && (
          <div className="sample-prompts-container">
            <span className="samples-label">O pulsa un ejemplo para empezar:</span>
            <div className="samples-pills">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="sample-prompt-pill"
                  onClick={() => setText(prompt)}
                >
                  <Sparkles size={13} /> {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="intake-field-error" role="alert">{error}</div>}

        <div className="intake-step-nav">
          <button
            type="button"
            className="text-button quiet-action"
            onClick={onSaveAndExit}
            disabled={busy}
          >
            Guardar y salir
          </button>

          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Entendiendo tu situación…' : 'Continuar'} <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
