'use client';
import { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Lock,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import type { IntakeFile } from '@/lib/intake';
import { fileProblem, suggestKind } from '@/lib/intake';
import type { LegalCategoryKey } from '@/lib/intake-engine';
import { INTAKE_CATEGORIES } from '@/lib/intake-engine';

interface DocumentsStepProps {
  category: LegalCategoryKey;
  files: IntakeFile[];
  onFilesChange: (files: IntakeFile[]) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  onSaveAndExit: () => void;
  busy?: boolean;
}

export default function DocumentsStep({
  category,
  files,
  onFilesChange,
  onContinue,
  onSkip,
  onBack,
  onSaveAndExit,
  busy = false
}: DocumentsStepProps) {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryMeta = INTAKE_CATEGORIES[category] || INTAKE_CATEGORIES.otro;
  const recommendedDocs = categoryMeta.recommendedDocs || [];

  const handleAddFiles = async (fileList: File[]) => {
    setError('');
    if (files.length + fileList.length > 30) {
      setError('Puedes reunir hasta 30 archivos en tu expediente.');
      return;
    }

    const problem = fileList.map(fileProblem).find(Boolean);
    if (problem) {
      setError(problem);
      return;
    }

    const newItems: IntakeFile[] = await Promise.all(
      fileList.map(async (file) => {
        const text = /\.txt$/i.test(file.name)
          ? (await file.text()).slice(0, 10000)
          : '';
        return {
          id: crypto.randomUUID(),
          file,
          kind: suggestKind(file.name, text)
        };
      })
    );

    onFilesChange([...files, ...newItems]);
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="intake-step documents-step">
      <div className="step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> PASO 3 · EVIDENCIA Y EXPEDIENTE
        </span>
        <h1 className="editorial-headline">¿Tienes documentos que puedan ayudar?</h1>
        <p className="step-sub">
          No son obligatorios para continuar. Si los tienes a mano, podemos organizar mejor tu expediente desde el principio.
        </p>
      </div>

      {/* Recommended documents for this legal branch */}
      <div className="recommended-docs-panel">
        <div className="recommended-header">
          <FileCheck2 size={16} className="rec-icon" />
          <span>Podrían ser útiles para tu asunto ({categoryMeta.shortLabel}):</span>
        </div>
        <div className="recommended-pills">
          {recommendedDocs.map((docName, idx) => (
            <span key={idx} className="rec-pill">
              {docName}
            </span>
          ))}
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        className={`upload-drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleAddFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="upload-zone-content">
          <div className="upload-icon-circle">
            <Upload size={24} />
          </div>
          <h3>Arrastra tus archivos aquí</h3>
          <p>o selecciónalos desde tu ordenador o teléfono.</p>
          <button
            type="button"
            className="button outline small select-files-btn"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Plus size={15} /> Elegir archivos
          </button>
          <small className="supported-formats-note">
            PDF, Word (.docx) o texto (.txt) · Hasta 10 MB por archivo
          </small>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            void handleAddFiles(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
      </div>

      {error && <div className="intake-field-error" role="alert">{error}</div>}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="uploaded-files-section">
          <div className="uploaded-list-header">
            <span className="files-count-badge">
              <Check size={14} /> {files.length} archivo{files.length !== 1 ? 's' : ''} preparado{files.length !== 1 ? 's' : ''}
            </span>
            <span className="security-notice-badge">
              <Lock size={12} /> Los abogados no pueden abrir estos archivos todavía
            </span>
          </div>

          <div className="files-cards-grid">
            {files.map((item) => (
              <article key={item.id} className="file-item-card">
                <div className="file-icon-box">
                  <FileText size={20} />
                </div>
                <div className="file-item-details">
                  <strong className="file-item-name" title={item.file.name}>
                    {item.file.name}
                  </strong>
                  <div className="file-item-meta">
                    <span className="file-size">{formatFileSize(item.file.size)}</span>
                    <span className="file-privacy-tag">
                      <Lock size={11} /> 🔒 Privado
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-button danger remove-file-btn"
                  onClick={() => handleRemoveFile(item.id)}
                  aria-label={`Eliminar ${item.file.name}`}
                  title="Eliminar archivo"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Assurance Banner */}
      <div className="documents-privacy-card">
        <ShieldCheck size={20} className="shield-icon" />
        <div className="shield-content">
          <strong>Archivos totalmente protegidos</strong>
          <p>
            Al publicar tu caso, los abogados solo verán que tienes {files.length ? `${files.length} documento(s) preparados` : 'documentos disponibles'}, pero <strong>nunca podrán descargarlos ni abrirlos</strong> sin que tú autorices cada solicitud individual.
          </p>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="intake-step-nav">
        <div className="nav-left-cluster">
          <button type="button" className="text-button" onClick={onBack}>
            <ArrowLeft size={16} /> Atrás
          </button>
          <button
            type="button"
            className="text-button quiet-action"
            onClick={onSaveAndExit}
          >
            Guardar y salir
          </button>
        </div>

        <div className="nav-right-cluster">
          {files.length === 0 ? (
            <button
              type="button"
              className="button outline"
              onClick={onSkip}
            >
              Omitir por ahora
            </button>
          ) : null}

          <button
            type="button"
            className="button"
            onClick={onContinue}
          >
            {files.length > 0 ? 'Continuar con estos archivos' : 'Continuar sin documentos'} <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
