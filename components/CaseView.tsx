'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Edit2,
  FileText,
  Lock,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { api, browserDB } from '@/lib/browser';
import { statusLabels } from '@/lib/shared';
import {
  INTAKE_CATEGORIES,
  type LegalCategoryKey,
  analyzeNarrativeHeuristically
} from '@/lib/intake-engine';
import IntakeProgress from './intake/IntakeProgress';
import CasePermissionsManager from './intake/CasePermissionsManager';
import { CaseForm, Field, Modal, UploadBox, type Row } from './Forms';
import { Empty, type WorkProps } from './Workspace';

const money = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n);

const date = (s: string) =>
  new Date(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const COLOMBIAN_CITIES_LIST = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Santa Marta',
  'Ibagué',
  'Cúcuta',
  'Manizales',
  'Pasto',
  'Neiva',
  'Villavicencio',
  'Armenia',
  'Valledupar',
  'Montería',
  'Popayán',
  'Sincelejo',
  'Tunja',
  'Riohacha',
  'Florencia',
  'Yopal',
  'Quibdó'
];

const COMMON_DATE_OPTIONS = [
  'Hoy o ayer',
  'Esta semana',
  'La semana pasada',
  'Hace 2 a 4 semanas',
  'Hace 1 a 3 meses',
  'Hace 3 a 6 meses',
  'Hace 6 a 12 meses',
  'Hace más de 1 año'
];

const CATEGORY_ORDER: LegalCategoryKey[] = [
  'laboral',
  'familia',
  'civil_contractual',
  'comercial',
  'inmobiliario',
  'consumidor',
  'administrativo',
  'penal',
  'transito_responsabilidad',
  'propiedad_intelectual',
  'otro',
  'no_seguro'
];

function getCategoryInfo(rawCat: string) {
  const norm = (rawCat || '').toLowerCase().trim();
  for (const [key, meta] of Object.entries(INTAKE_CATEGORIES)) {
    if (
      key === norm ||
      meta.label.toLowerCase() === norm ||
      meta.shortLabel.toLowerCase() === norm ||
      norm.includes(key) ||
      (meta.shortLabel && norm.includes(meta.shortLabel.toLowerCase()))
    ) {
      return { key: key as LegalCategoryKey, label: meta.label, shortLabel: meta.shortLabel };
    }
  }
  return { key: 'otro' as LegalCategoryKey, label: rawCat || 'Otro asunto', shortLabel: rawCat || 'Otro' };
}

function getFactsList(c: Row | null | undefined): string[] {
  if (!c) return [];
  if (c.ai_result?.facts && c.ai_result.facts.length > 0) {
    return c.ai_result.facts;
  }
  const extracted = analyzeNarrativeHeuristically(c.description || c.public_summary || '').extractedFacts;
  if (extracted && extracted.length > 0) {
    return extracted;
  }
  const sentences = (c.description || '')
    .split(/[.;\n]+/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 15);
  return sentences.length > 0
    ? sentences.slice(0, 4)
    : ['Relato aportado por el cliente en su espacio privado.'];
}

export default function CaseView(props: WorkProps & { id: string; onBack: () => void }) {
  const { id, run, busy, onNotice, session } = props;
  const [data, setData] = useState<Row | null>(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [professional, setProfessional] = useState<Row | null>(null);
  const [lawyerId, setLawyerId] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [showAreaPanel, setShowAreaPanel] = useState(false);
  const [editingField, setEditingField] = useState<'summary' | 'goal' | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [selectedDateOption, setSelectedDateOption] = useState('La semana pasada');

  async function refresh() {
    setData(await api('cases/' + id));
  }

  useEffect(() => {
    let active = true;
    api('cases/' + id)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });

    const update = () => {
      api('cases/' + id)
        .then((d) => {
          if (active) setData(d);
        })
        .catch(() => {});
    };

    window.addEventListener('lexmarket-update', update);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        api('cases/' + id)
          .then((d) => {
            if (active) setData(d);
          })
          .catch(() => {});
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('lexmarket-update', update);
    };
  }, [id]);

  const c = data?.case;
  const owner = !!data?.owner;
  const hasPrivate = !!data?.private;

  async function action(path: string, payload: Row = {}, method = 'POST') {
    await api('cases/' + id + '/' + path, method, payload);
    await refresh();
    setModal('');
  }

  function name(lid: string) {
    return data?.professionals.find((p: Row) => p.id === lid)?.name || 'Profesional';
  }

  async function showProfessional(lid: string) {
    setProfessional(await api('professionals/' + lid));
    setModal('professional');
  }

  async function files(list: File[]) {
    if (!list.length) return;
    await run(async () => {
      const failed: string[] = [];
      for (let i = 0; i < list.length; i++) {
        setUploadProgress(`${i + 1} de ${list.length}: ${list[i].name}`);
        try {
          const form = new FormData();
          form.append('file', list[i]);
          await api('cases/' + id + '/documents', 'POST', form);
        } catch (e) {
          failed.push(list[i].name + ': ' + (e instanceof Error ? e.message : 'No se pudo subir'));
        }
      }
      setUploadProgress('');
      await refresh();
      if (failed.length) throw new Error(failed.join(' · '));
      onNotice('Archivos recibidos. Los estamos preparando para que puedas usarlos en tu caso.');
    });
  }

  async function download(d: Row) {
    const { data: s } = await browserDB()!.auth.getSession();
    const r = await fetch('/api/documents/' + d.id, {
      headers: { Authorization: 'Bearer ' + s.session?.access_token }
    });
    if (!r.ok) throw new Error((await r.json()).error);
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = d.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportCase() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matchjuridico-' + id + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!data || !c) {
    return (
      <div className="case-detail-root">
        <button className="back-button-quiet" onClick={props.onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="notice-panel" role={loadError ? 'alert' : 'status'}>
          {loadError || 'Abriendo tu espacio…'}
        </div>
      </div>
    );
  }

  const activeRequests = (data.requests || []).filter((r: Row) => r.state === 'granted');
  const activeLawyer = owner ? lawyerId || activeRequests[0]?.lawyer_id : session.user.id;
  const ownRequest = (data.requests || []).find((r: Row) => r.lawyer_id === session.user.id);
  const selectedLawyer = c.selected_lawyer === session.user.id;

  const catInfo = getCategoryInfo(c?.category);
  const factsList = getFactsList(c);

  return (
    <div className="case-detail-root">
      {/* 1. Public View if Viewer is not owner and case has no private access granted */}
      {!hasPrivate ? (
        <>
          <div className="case-detail-breadcrumb-row">
            <button className="back-button-quiet" onClick={props.onBack}>
              <ArrowLeft size={15} />
              <span>Volver a {props.me.profile.role === 'lawyer' ? 'los casos' : 'mi espacio'}</span>
            </button>
          </div>

          <section className="case-panel public-case-panel">
            <div className="public-icon-box">
              <FileText size={24} />
            </div>
            <h2 className="case-panel-title">Una primera mirada</h2>
            <p className="preserve case-body-text">{c.public_summary}</p>
            <div className="private-callout-box">
              <LockKeyhole size={22} className="callout-lock-icon" />
              <div>
                <h3>El expediente se comparte con autorización</h3>
                <p>
                  Cuéntale al cliente cómo podrías ayudarle. Si autoriza tu acceso, podrás revisar los documentos y enviar una propuesta.
                </p>
              </div>
            </div>
            {ownRequest ? (
              <div className="public-case-actions">
                <span className="case-pill status-pill">{statusLabels[ownRequest.state]}</span>
                {ownRequest.state !== 'revoked' && (
                  <button
                    type="button"
                    className="button button-burgundy small"
                    onClick={() => props.onChat?.(id, session.user.id)}
                  >
                    Conversar
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="button button-burgundy"
                onClick={() => setModal('access')}
              >
                Me interesa este caso <ArrowRight size={16} />
              </button>
            )}

            {data.documents.length > 0 && (
              <div className="preview-docs-block">
                <h3>Documentos de vista previa</h3>
                <p className="microcopy">Copias seleccionadas por el cliente para la revisión inicial.</p>
                <div className="preview-docs-list">
                  {data.documents.map((d: Row) => (
                    <button
                      type="button"
                      className="preview-doc-chip"
                      key={d.id}
                      onClick={() => run(() => download(d))}
                    >
                      <Download size={14} />
                      <span>{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Navigation Tabs (Available for all tabs switching) */}
          <div className="case-page-navigation-strip">
            <nav className="case-detail-tabs" aria-label="Secciones del caso">
              {[
                ['overview', 'Mi caso'],
                ['documents', 'Documentos'],
                ['proposals', owner ? 'Abogados y propuestas' : 'Mi propuesta'],
                ['messages', 'Conversaciones'],
                ['progress', 'Seguimiento']
              ].map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  aria-current={tab === k ? 'page' : undefined}
                  className={`case-tab-btn ${tab === k ? 'active' : ''}`}
                >
                  <span>{v}</span>
                  {k === 'documents' && (
                    <span className="tab-count-pill">{data.documents.length}</span>
                  )}
                  {k === 'proposals' && (
                    <span className="tab-count-pill">
                      {owner
                        ? `${data.requests.filter((r: Row) => r.state !== 'revoked').length} interesados · ${data.proposals.filter((p: Row) => p.status === 'pending').length} propuestas`
                        : data.proposals.filter((p: Row) => p.status === 'pending').length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {c.urgency === 'urgent' && tab !== 'overview' && (
            <div className="notice-panel case-urgent-panel">
              Se ha indicado una situación urgente. Los tiempos que acuerdes aquí no sustituyen los plazos de una autoridad.
            </div>
          )}

          {owner && c.status === 'review' && (
            <p className="notice-panel" role="status">
              Tu caso está en revisión. Puedes retirar la solicitud para editarlo. Los documentos siguen privados.
            </p>
          )}

          {owner && c.moderation_note && (
            <p className="notice-panel">Revisión de la publicación: {c.moderation_note}</p>
          )}

          {/* Overview Tab: Literal Identical Interface to the Intake Popup */}
          {tab === 'overview' && (
            <div className="case-stage-card-wrapper">
              {/* Top Bar with Stepper (Identical to Intake popup header) */}
              <header className="case-stage-top-bar">
                <div className="case-stage-top-left">
                  <button className="back-button-quiet" onClick={props.onBack}>
                    <ArrowLeft size={15} />
                    <span>Volver a mi espacio</span>
                  </button>
                </div>

                <div className="case-stage-top-stepper">
                  <IntakeProgress
                    currentStage="review"
                    completedStages={new Set(['narrative', 'clarification', 'evidence', 'parties'])}
                    onNavigateStage={(stg) => {
                      if (stg === 'evidence') setTab('documents');
                      else setTab('overview');
                    }}
                  />
                </div>

                <div className="case-stage-top-right">
                  <span className={`case-pill status-pill status-${c.status}`}>
                    <span className="pill-dot burgundy" />
                    {statusLabels[c.status] || 'Borrador'}
                  </span>
                </div>
              </header>

              {/* 2-Column Split Stage (Identical to Intake popup body) */}
              <div className="case-stage-grid">
                {/* Left Column: Contextual Narrative & Reassurance */}
                <aside className="case-page-aside">
                  <div className="aside-top">
                    <div className="aside-narrative-copy">
                      <span className="eyebrow aside-eyebrow">
                        <span className="tiny-dot" /> ASISTENCIA INTELIGENTE
                      </span>
                      <h2 className="aside-headline">Organizamos{'\n'}tu información.</h2>
                      <p className="aside-sub">
                        Extraemos lo esencial de tu relato para que puedas revisarlo y corregir cualquier detalle.
                      </p>
                    </div>
                  </div>

                  <div className="aside-visual-wrapper">
                    <img
                      src="/intake-expediente.png"
                      alt="Expediente"
                      className="aside-atmospheric-img"
                    />
                  </div>

                  <div className="aside-bottom">
                    <p className="intake-private-notice">
                      <Lock size={14} className="lock-icon" />
                      <span>Por ahora, todo se guarda bajo tu control en este espacio privado.</span>
                    </p>
                  </div>
                </aside>

                {/* Right Column: Exact SummaryReviewStep content */}
                <main className="case-page-main">
                  <div className="step-header summary-step-header">
                    <h1 className="editorial-headline summary-compact-title">Esto es lo que entendimos.</h1>
                    <p className="step-sub summary-compact-sub">
                      Revisa si los puntos clave son correctos o edita cualquier detalle antes de continuar.
                    </p>
                  </div>

                  <div className="extracted-overview-card">
                    {/* 1. Legal Area Bar */}
                    <div className="summary-category-bar compact-view">
                      <div className="category-meta">
                        <span className="provisional-tag">ÁREA LEGAL SUGERIDA (PROVISIONAL)</span>
                        <div className="category-current-badge-row">
                          <span className="current-area-badge">
                            <span className="area-indicator-dot" />
                            {catInfo.label}
                          </span>
                        </div>
                      </div>

                      {owner && c.status === 'draft' && (
                        <button
                          type="button"
                          className="button outline small select-area-btn"
                          onClick={() => setShowAreaPanel(true)}
                        >
                          <Edit2 size={13} />
                          <span>Seleccionar área legal</span>
                        </button>
                      )}
                    </div>

                    {/* 2. Structured Insights List */}
                    <div className="summary-details-list">
                      {/* Situation Summary */}
                      <article className="summary-field-row">
                        <div className="field-meta">
                          <span className="field-title">Resumen de tu situación</span>
                          {editingField === 'summary' ? (
                            <div className="inline-edit-box">
                              <textarea
                                rows={3}
                                value={editSummary}
                                onChange={(e) => setEditSummary(e.target.value)}
                              />
                              <div className="inline-edit-actions">
                                <button
                                  type="button"
                                  className="button small button-burgundy"
                                  onClick={async () => {
                                    await run(async () => {
                                      await api('cases/' + id, 'PATCH', {
                                        description: editSummary,
                                        public_summary: editSummary
                                      });
                                      await refresh();
                                      setEditingField(null);
                                      onNotice('Resumen actualizado.');
                                    });
                                  }}
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => setEditingField(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="field-value">{c.description || c.public_summary}</p>
                          )}
                        </div>
                        {editingField !== 'summary' && owner && c.status === 'draft' && (
                          <button
                            type="button"
                            className="text-button small-edit"
                            onClick={() => {
                              setEditSummary(c.description || c.public_summary);
                              setEditingField('summary');
                            }}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                        )}
                      </article>

                      {/* Desired Outcome */}
                      <article className="summary-field-row">
                        <div className="field-meta">
                          <span className="field-title">Lo que buscas resolver</span>
                          {editingField === 'goal' ? (
                            <div className="inline-edit-box">
                              <input
                                type="text"
                                value={editGoal}
                                onChange={(e) => setEditGoal(e.target.value)}
                              />
                              <div className="inline-edit-actions">
                                <button
                                  type="button"
                                  className="button small button-burgundy"
                                  onClick={async () => {
                                    await run(async () => {
                                      await api('cases/' + id, 'PATCH', { service: editGoal });
                                      await refresh();
                                      setEditingField(null);
                                      onNotice('Objetivo actualizado.');
                                    });
                                  }}
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => setEditingField(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="field-value">{c.service || 'Entender mis opciones y posibles reclamaciones.'}</p>
                          )}
                        </div>
                        {editingField !== 'goal' && owner && c.status === 'draft' && (
                          <button
                            type="button"
                            className="text-button small-edit"
                            onClick={() => {
                              setEditGoal(c.service || 'Entender mis opciones y posibles reclamaciones.');
                              setEditingField('goal');
                            }}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                        )}
                      </article>

                      {/* Two-column selectors: Dates & City */}
                      <div className="summary-two-col">
                        <article className="summary-field-box direct-selector-box">
                          <div className="box-header">
                            <span className="box-title">
                              <Calendar size={14} /> Fechas importantes
                            </span>
                            <span className="direct-selected-badge">
                              <Check size={11} strokeWidth={2.5} /> Definida
                            </span>
                          </div>

                          <div className="direct-picker-container">
                            <div className="direct-picker-wrap">
                              <select
                                className="direct-picker-select"
                                value={selectedDateOption}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  setSelectedDateOption(val);
                                  if (val === 'Atención urgente') {
                                    await run(async () => {
                                      await api('cases/' + id, 'PATCH', { urgency: 'urgent' });
                                      await refresh();
                                      onNotice('Prioridad urgente indicada.');
                                    });
                                  }
                                }}
                                aria-label="Seleccionar fecha importante"
                              >
                                {COMMON_DATE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                                <option value="Atención urgente">Atención urgente</option>
                              </select>
                              <ChevronDown size={15} className="direct-picker-arrow" />
                            </div>
                          </div>
                        </article>

                        <article className="summary-field-box direct-selector-box">
                          <div className="box-header">
                            <span className="box-title">
                              <MapPin size={14} /> Ciudad / Ubicación
                            </span>
                            {c.city && (
                              <span className="direct-selected-badge">
                                <Check size={11} strokeWidth={2.5} /> Definida
                              </span>
                            )}
                          </div>

                          <div className="direct-picker-container">
                            <div className="direct-picker-wrap">
                              <select
                                className="direct-picker-select"
                                value={c.city || ''}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    await run(async () => {
                                      await api('cases/' + id, 'PATCH', { city: val });
                                      await refresh();
                                      onNotice('Ciudad actualizada a ' + val);
                                    });
                                  }
                                }}
                                aria-label="Seleccionar ciudad o ubicación"
                              >
                                <option value="">Seleccionar ciudad...</option>
                                {c.city && !COLOMBIAN_CITIES_LIST.includes(c.city) && (
                                  <option value={c.city}>{c.city}</option>
                                )}
                                {COLOMBIAN_CITIES_LIST.map((city) => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={15} className="direct-picker-arrow" />
                            </div>
                          </div>
                        </article>
                      </div>

                      {/* Key facts list */}
                      {factsList.length > 0 && (
                        <div className="facts-section">
                          <span className="facts-header">Hechos clave identificados:</span>
                          <ul className="facts-list">
                            {factsList.map((fact: string, i: number) => (
                              <li key={i}>
                                <Check size={14} className="fact-check" />
                                <span>{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Attached Documents Row */}
                      <div className="summary-documents-row">
                        <div className="summary-docs-header">
                          <span className="facts-header">
                            Documentos aportados ({data.documents.length}):
                          </span>
                          {owner && c.status !== 'closed' && (
                            <label className="inline-add-doc-btn">
                              <Plus size={13} />
                              <span>Agregar documentos</span>
                              <input
                                type="file"
                                multiple
                                hidden
                                onChange={(e) => {
                                  const list = Array.from(e.target.files || []);
                                  if (list.length) void files(list);
                                }}
                              />
                            </label>
                          )}
                        </div>
                        {data.documents.length > 0 ? (
                          <div className="summary-docs-chips-wrap">
                            {data.documents.map((d: Row) => (
                              <div key={d.id} className="summary-doc-pill">
                                <FileText size={14} className="doc-pill-icon" />
                                <button
                                  type="button"
                                  className="doc-pill-name"
                                  onClick={() => run(() => download(d))}
                                  title={`Descargar ${d.name}`}
                                >
                                  {d.name}
                                </button>
                                <button
                                  type="button"
                                  className="doc-pill-action"
                                  onClick={() => run(() => download(d))}
                                  aria-label={`Descargar ${d.name}`}
                                >
                                  <Download size={13} />
                                </button>
                                {owner && c.status === 'draft' && (
                                  <button
                                    type="button"
                                    className="doc-pill-action danger"
                                    onClick={() => {
                                      setSelected(d);
                                      setModal('delete-file');
                                    }}
                                    aria-label={`Eliminar ${d.name}`}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="summary-docs-empty-hint">
                            No has adjuntado documentos aún. Son opcionales y permanecen 100% privados.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="case-stage-nav-footer">
                    <button
                      type="button"
                      className="text-button quiet-action"
                      onClick={props.onBack}
                    >
                      <ArrowLeft size={16} /> Volver a mi espacio
                    </button>

                    <div className="summary-forward-actions">
                      {owner && c.status === 'draft' ? (
                        <button
                          type="button"
                          className="button button-burgundy case-publish-button"
                          onClick={() => setModal('publish')}
                        >
                          Compartir caso <ArrowRight size={17} />
                        </button>
                      ) : owner && ['published', 'review'].includes(c.status) ? (
                        <button
                          type="button"
                          className="button outline small"
                          onClick={() =>
                            run(async () => {
                              await action('pause');
                              onNotice('Publicación pausada. Ahora puedes editar el resumen.');
                            })
                          }
                          disabled={busy}
                        >
                          Pausar para editar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </main>
              </div>
            </div>
          )}

          {/* 7. Documents Tab */}
          {tab === 'documents' && (
            <section className="case-panel">
              <div className="case-panel-header">
                <div>
                  <h2 className="case-panel-title">Todo lo que ayuda a entender tu caso</h2>
                  <p className="case-panel-subtitle">
                    El escrito principal, pruebas, respuestas recibidas o notas que quieras compartir.
                  </p>
                </div>
                <div className="panel-lock-icon-box">
                  <LockKeyhole size={20} />
                </div>
              </div>

              {c.status !== 'closed' && (owner || selectedLawyer) && (
                <UploadBox onFiles={files} busy={busy} />
              )}

              <p className="microcopy">
                Los archivos son opcionales. Para traer una conversación de ChatGPT u otra IA, guárdala como PDF/TXT o pega los fragmentos relevantes al editar el caso. Esta beta no accede a tus cuentas ni importa enlaces de chats.
              </p>

              {uploadProgress && <p role="status" className="upload-progress-text">{uploadProgress}</p>}

              <div className="document-list-stack">
                {data.documents.map((d: Row) => (
                  <div className="document-item-row" key={d.id}>
                    <div className="doc-item-icon">
                      <FileText size={18} />
                    </div>
                    <div className="doc-item-info">
                      <b>{d.name}</b>
                      <small>{(d.size / 1024).toFixed(0)} KB · {statusLabels[d.state]}</small>
                      {d.extraction_note && <small className="doc-note">{d.extraction_note}</small>}
                    </div>
                    <div className="doc-item-actions">
                      <button
                        type="button"
                        className="button outline small doc-action-btn"
                        aria-label={'Descargar ' + d.name}
                        disabled={d.state !== 'clean' || busy}
                        onClick={() => run(() => download(d))}
                      >
                        <Download size={15} />
                        <span>Descargar</span>
                      </button>
                      {owner && d.state === 'clean' && (
                        <button
                          type="button"
                          className="button outline small"
                          onClick={() => {
                            setSelected(d);
                            setModal('preview-file');
                          }}
                        >
                          {d.preview_shared ? 'Retirar vista previa' : 'Compartir copia'}
                        </button>
                      )}
                      {owner && (
                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label={'Eliminar ' + d.name}
                          disabled={busy}
                          onClick={() => {
                            setSelected(d);
                            setModal('delete-file');
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!data.documents.length && (
                <p className="muted-notice">Todavía no hay archivos. No necesitas subirlos todos de una vez.</p>
              )}
            </section>
          )}

          {/* 8. Proposals Tab */}
          {tab === 'proposals' && (
            <>
              {owner && (
                <section className="case-panel">
                  <h2 className="case-panel-title">Profesionales interesados</h2>
                  <p className="case-panel-subtitle">
                    Conoce su perfil y decide a quién invitas a revisar el expediente. Autorizar acceso no equivale a contratar.
                  </p>
                  {data.requests.length ? (
                    <div className="requests-stack">
                      {data.requests.map((r: Row) => (
                        <article className="request-card-row" key={r.id}>
                          <div className="request-profile-meta">
                            <span className="avatar-circle">{name(r.lawyer_id).slice(0, 1)}</span>
                            <div>
                              <button
                                type="button"
                                className="profile-name-button"
                                onClick={() => run(() => showProfessional(r.lawyer_id))}
                              >
                                {name(r.lawyer_id)}
                                <ArrowRight size={13} />
                              </button>
                              <small>{statusLabels[r.state]}</small>
                            </div>
                          </div>
                          <p className="request-note-text">{r.note}</p>
                          <div className="request-actions-row">
                            {r.state === 'requested' && (
                              <button
                                type="button"
                                className="button button-burgundy small"
                                onClick={() => props.onChat?.(id, r.lawyer_id)}
                              >
                                Conversar
                              </button>
                            )}
                            {r.state !== 'granted' ? (
                              <button
                                type="button"
                                className="button outline small"
                                disabled={busy}
                                onClick={() => {
                                  setSelected(r);
                                  setModal('grant');
                                }}
                              >
                                Autorizar acceso
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="button button-burgundy small"
                                  onClick={() => {
                                    setLawyerId(r.lawyer_id);
                                    props.onChat?.(id, r.lawyer_id);
                                  }}
                                >
                                  Conversar <MessageCircle size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="text-button"
                                  disabled={busy}
                                  onClick={() => {
                                    setSelected(r);
                                    setModal('revoke');
                                  }}
                                >
                                  Retirar acceso
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="notice-panel">Las solicitudes aparecerán aquí cuando un abogado se interese por tu caso.</p>
                  )}
                </section>
              )}

              {owner && (
                <CasePermissionsManager
                  grants={data.requests
                    .filter((r: Row) => r.state === 'granted')
                    .map((r: Row) => ({
                      lawyerId: r.lawyer_id,
                      lawyerName: name(r.lawyer_id),
                      canViewSummary: true,
                      canViewFacts: true,
                      canViewIdentity: false,
                      canViewPrivateParties: false,
                      grantedDocumentIds: data.documents.map((d: Row) => d.id),
                      canViewFullExpediente: true,
                      grantedAt: r.updated_at || r.created_at
                    }))}
                  onRevokeAccess={async (lid) => {
                    await action('access', { lawyer_id: lid, state: 'revoked' }, 'PATCH');
                    onNotice('Acceso retirado correctamente.');
                  }}
                  busy={busy}
                />
              )}

              <div className="case-proposals-section-header">
                <h2 className="case-panel-title">{owner ? 'Propuestas para avanzar' : 'Tu propuesta'}</h2>
                {!owner && c.status === 'published' && (
                  <button
                    type="button"
                    className="button button-burgundy"
                    onClick={() => setModal('proposal')}
                  >
                    Preparar propuesta <Plus size={16} />
                  </button>
                )}
              </div>

              {data.proposals.length ? (
                <div className="proposals-cards-grid">
                  {data.proposals.map((p: Row) => (
                    <article className="proposal-card-item" key={p.id}>
                      <div className="proposal-top-row">
                        <button
                          type="button"
                          className="profile-name-button"
                          onClick={() => run(() => showProfessional(p.lawyer_id))}
                        >
                          {name(p.lawyer_id)}
                        </button>
                        <span className="case-pill status-pill">{statusLabels[p.status]}</span>
                      </div>
                      <div className="proposal-price-box">
                        <span className="price-amount">{money(p.amount)}</span>
                        <small>Honorarios propuestos · COP</small>
                      </div>
                      <h4>Qué incluye</h4>
                      <p className="preserve">{p.scope}</p>
                      <h4>Qué queda fuera</h4>
                      <p className="preserve">{p.exclusions}</p>
                      <h4>Tiempo estimado de trabajo</h4>
                      <p>{p.days} días desde el inicio acordado. No es un plazo de resolución judicial.</p>
                      <h4>Forma de pago propuesta</h4>
                      <p>{p.payment_terms}</p>
                      {owner && p.status === 'pending' && c.status === 'published' && (
                        <button
                          type="button"
                          className="button button-burgundy"
                          disabled={busy}
                          onClick={() => {
                            setSelected(p);
                            setModal('accept');
                          }}
                        >
                          Elegir esta propuesta <ArrowRight size={16} />
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title={owner ? 'Demos lugar a una buena propuesta' : 'Explica cómo puedes ayudar'}
                  text={
                    owner
                      ? 'Los profesionales autorizados podrán enviarte su alcance y honorarios después de revisar el expediente.'
                      : 'Define entregables, límites, tiempos y honorarios. El cliente podrá comparar y decidir.'
                  }
                />
              )}
            </>
          )}

          {/* 9. Messages Tab */}
          {tab === 'messages' && (
            <section className="case-panel">
              <h2 className="case-panel-title">Hablemos del siguiente paso</h2>
              <p className="case-panel-subtitle">
                Una conversación privada con cada profesional para resolver dudas, compartir documentos y acordar honorarios.
              </p>
              {owner && activeRequests.length > 0 && (
                <Field label="Con quién quieres conversar">
                  <select
                    value={activeLawyer}
                    onChange={(e) => setLawyerId(e.target.value)}
                    className="case-select-control"
                  >
                    {activeRequests.map((r: Row) => (
                      <option key={r.lawyer_id} value={r.lawyer_id}>
                        {name(r.lawyer_id)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {activeLawyer && (owner ? activeRequests.length > 0 : ownRequest?.state === 'granted') ? (
                <button
                  type="button"
                  className="button button-burgundy"
                  onClick={() => props.onChat?.(id, activeLawyer)}
                >
                  Abrir conversación <MessageCircle size={17} />
                </button>
              ) : (
                <Empty
                  title="El primer encuentro está por llegar"
                  text="Cuando autorices el acceso de un abogado, podrán conversar aquí antes de acordar el encargo."
                />
              )}
            </section>
          )}

          {/* 10. Progress Tab */}
          {tab === 'progress' && (
            <div className="case-detail-grid">
              <section className="case-panel">
                <h2 className="case-panel-title">El camino hasta aquí</h2>
                <p className="microcopy">
                  Son actualizaciones registradas por los participantes. Una presentación debe acompañarse de su comprobante en Documentos.
                </p>
                <ol className="timeline">
                  {data.events.map((e: Row) => (
                    <li key={e.id}>
                      <span className="timeline-dot" />
                      <time>{date(e.created_at)}</time>
                      <h3>{e.title}</h3>
                      {e.detail && <p className="preserve">{e.detail}</p>}
                    </li>
                  ))}
                </ol>
                {selectedLawyer && c.status === 'engaged' && (
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => setModal('event')}
                  >
                    <Plus size={16} /> Registrar actualización
                  </button>
                )}
              </section>

              <aside className="case-detail-aside-col">
                <section className="case-aside-card">
                  <h3 className="aside-card-title">Un cierre claro también importa</h3>
                  <p className="aside-card-desc">
                    Cuando termine el acompañamiento, el cliente puede cerrar el espacio y compartir su experiencia.
                  </p>
                  {owner && c.status === 'engaged' && (
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => setModal('close')}
                    >
                      Cerrar acompañamiento
                    </button>
                  )}
                  {owner && c.status === 'closed' && !data.reviews.length && (
                    <button
                      type="button"
                      className="button button-burgundy"
                      onClick={() => setModal('review')}
                    >
                      <Star size={16} /> Valorar mi experiencia
                    </button>
                  )}
                  {data.reviews?.map((r: Row, i: number) => (
                    <div className="review-box" key={i}>
                      <b>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</b>
                      <p>{r.comment}</p>
                    </div>
                  ))}
                </section>
              </aside>
            </div>
          )}
        </>
      )}

      {/* Legal Area Selection Modal (Identical to Intake popup area panel) */}
      {showAreaPanel && (
        <div className="area-panel-backdrop" onClick={() => setShowAreaPanel(false)}>
          <div
            className="area-panel-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-panel-title"
          >
            <div className="area-panel-header">
              <div>
                <span className="provisional-tag">ÁREA LEGAL</span>
                <h2 id="area-panel-title" className="area-panel-title">
                  Seleccionar área legal
                </h2>
                <p className="area-panel-subtitle">
                  Elige la especialidad que mejor describa tu caso. Si tienes dudas, puedes seleccionar &quot;No estoy seguro&quot; al final.
                </p>
              </div>
              <button
                type="button"
                className="close-panel-btn"
                onClick={() => setShowAreaPanel(false)}
                aria-label="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="area-panel-grid">
              {CATEGORY_ORDER.map((catKey) => {
                const catItem = INTAKE_CATEGORIES[catKey];
                const isSelected = catInfo.key === catKey;
                const isNoSeguro = catKey === 'no_seguro';

                return (
                  <button
                    key={catKey}
                    type="button"
                    className={`area-panel-card ${isSelected ? 'selected' : ''} ${
                      isNoSeguro ? 'card-no-seguro' : ''
                    }`}
                    onClick={async () => {
                      setShowAreaPanel(false);
                      await run(async () => {
                        await api('cases/' + id, 'PATCH', { category: catItem.label });
                        await refresh();
                        onNotice('Área legal actualizada a ' + catItem.label);
                      });
                    }}
                  >
                    <div className="area-card-top">
                      <span className="area-card-label">{catItem.label}</span>
                      {isSelected ? (
                        <span className="area-check-badge">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="area-radio-dot" />
                      )}
                    </div>
                    <p className="area-card-desc">{catItem.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 11. Modal Dialogs styled in Burgundy & Cream Design */}
      {modal && (
        <Modal
          title={
            {
              edit: 'Ajustemos los detalles',
              'edit-ai': 'Revisa la sugerencia antes de guardar',
              publish: 'Una última mirada antes de compartir',
              access: 'Cuéntale cómo puedes ayudar',
              grant: 'Compartir el expediente',
              revoke: 'Retirar acceso',
              proposal: 'Una propuesta clara desde el principio',
              accept: '¿Avanzamos con esta propuesta?',
              ai: 'Organicemos tu información',
              event: 'Una novedad para tu cliente',
              close: 'Cerrar este acompañamiento',
              review: '¿Cómo fue tu experiencia?',
              professional: 'Conoce al profesional',
              'delete-file': 'Eliminar documento',
              'delete-case': 'Eliminar este borrador'
            }[modal] || ''
          }
          onClose={() => setModal('')}
        >
          {(modal === 'edit' || modal === 'edit-ai') && (
            <CaseForm
              initial={modal === 'edit-ai' ? selected || c : c}
              busy={busy}
              onSave={(p) =>
                run(async () => {
                  await api('cases/' + id, 'PATCH', p);
                  await refresh();
                  setModal('');
                  setSelected(null);
                  onNotice('Cambios guardados.');
                })
              }
            />
          )}

          {modal === 'preview-file' && selected && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api('documents/' + selected.id, 'PATCH', {
                    preview_shared: !selected.preview_shared,
                    reviewed: true
                  });
                  await refresh();
                  setModal('');
                  onNotice(
                    selected.preview_shared
                      ? 'Vista previa retirada.'
                      : 'Copia disponible para profesionales verificados mientras el caso esté publicado.'
                  );
                });
              }}
            >
              <h3>{selected.preview_shared ? 'Retirar vista previa' : 'Compartir una copia revisada'}</h3>
              <p>{selected.name}</p>
              <p className="microcopy">
                Comparte únicamente una copia sin nombres, firmas, identificaciones ni datos sensibles, incluido el nombre del archivo. MatchJurídico no anonimiza este documento automáticamente. Los profesionales verificados podrán descargarlo sin pedir acceso mientras tu caso esté publicado.
              </p>
              <label className="checkbox-line">
                <input type="checkbox" required />
                <span>
                  {selected.preview_shared
                    ? 'Quiero retirar esta copia de la vista previa.'
                    : 'Revisé el contenido y el nombre del archivo y autorizo compartir esta copia.'}
                </span>
              </label>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                {selected.preview_shared ? 'Retirar copia' : 'Compartir copia'}
              </button>
            </form>
          )}

          {modal === 'publish' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const summary = String(new FormData(e.currentTarget).get('public_summary') || '');
                void run(async () => {
                  await api('cases/' + id, 'PATCH', { ...c, public_summary: summary });
                  await action('publish', { reviewed: true });
                  onNotice('Recibimos tu caso. Aparecerá para los abogados cuando aprobemos su publicación.');
                });
              }}
            >
              <p>
                Revisaremos esta presentación antes de mostrarla a los profesionales. Aprobar la publicación no evalúa la viabilidad jurídica.
              </p>
              <div className="publish-modal-preview-box">
                <strong className="preview-case-title">{c.title}</strong>
                <p className="preview-case-meta">{c.city} · {c.category}</p>
                <Field
                  label="Resumen para los abogados"
                  hint="Cuenta brevemente qué buscas, sin nombres ni datos que identifiquen a las personas."
                >
                  <textarea
                    name="public_summary"
                    required
                    minLength={30}
                    maxLength={2000}
                    rows={5}
                    defaultValue={c.public_summary}
                    placeholder="Lo que ocurrió y el acompañamiento que necesitas…"
                    className="publish-textarea"
                  />
                </Field>
              </div>
              <label className="checkbox-line">
                <input type="checkbox" required />
                <span>
                  Revisé el título, la ciudad y el resumen. No contienen datos que no quiera compartir ni identifican a personas involucradas.
                </span>
              </label>
              <p className="microcopy">
                Los documentos seguirán privados hasta que autorices cada acceso.
              </p>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Enviar a revisión <ArrowRight size={16} />
              </button>
            </form>
          )}

          {modal === 'access' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() =>
                  action('access', {
                    note: new FormData(e.currentTarget).get('note'),
                    conflict_checked: true
                  })
                );
              }}
            >
              <Field label="Tu primera aproximación">
                <textarea
                  name="note"
                  minLength={20}
                  maxLength={1000}
                  required
                  rows={5}
                  placeholder="Qué experiencia tienes en este tipo de asunto y qué necesitarías revisar."
                />
              </Field>
              <label className="checkbox-line">
                <input type="checkbox" required />
                <span>
                  No identifico un conflicto con la información disponible. Verificaré las identidades y posibles conflictos antes de asesorar o asumir el caso.
                </span>
              </label>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Solicitar acceso <ArrowRight size={16} />
              </button>
            </form>
          )}

          {modal === 'grant' && (
            <div className="grant-access-modal-box">
              <p>
                Autorizarás a <b>{name(selected!.lawyer_id)}</b> a leer el relato privado y descargar los documentos de este caso, incluidos los que agregues después.
              </p>
              <p className="microcopy">
                Podrás retirar el acceso desde aquí. Los archivos que ya haya descargado no pueden recuperarse.
              </p>
              <button
                type="button"
                className="button button-burgundy"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    action('access', { lawyer_id: selected!.lawyer_id, state: 'granted' }, 'PATCH')
                  )
                }
              >
                Autorizar acceso
              </button>
            </div>
          )}

          {modal === 'revoke' && (
            <div className="revoke-access-modal-box">
              <p>
                El profesional dejará de acceder al expediente y a nuevas conversaciones. Esto no revoca un poder ni termina por sí solo un encargo acordado.
              </p>
              <button
                type="button"
                className="button danger-bg"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    action('access', { lawyer_id: selected!.lawyer_id, state: 'revoked' }, 'PATCH')
                  )
                }
              >
                Retirar acceso
              </button>
            </div>
          )}

          {modal === 'proposal' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(() =>
                  action('proposals', {
                    ...Object.fromEntries(f),
                    amount: Number(f.get('amount')),
                    days: Number(f.get('days'))
                  })
                );
              }}
            >
              <Field label="Alcance y entregables">
                <textarea name="scope" minLength={30} maxLength={4000} required rows={4} />
              </Field>
              <Field label="Qué no incluye">
                <textarea name="exclusions" required minLength={5} maxLength={2000} rows={3} />
              </Field>
              <div className="form-grid">
                <Field label="Honorarios en COP">
                  <input name="amount" type="number" min={0} max={1000000000} step={1} required />
                </Field>
                <Field label="Días de trabajo estimados">
                  <input name="days" type="number" min={1} max={365} step={1} required />
                </Field>
              </div>
              <Field label="Forma de pago y condiciones">
                <textarea
                  name="payment_terms"
                  minLength={5}
                  maxLength={1000}
                  required
                  placeholder="Incluye impuestos aplicables, anticipos y gastos adicionales si los hay."
                />
              </Field>
              <p className="microcopy">
                La propuesta quedará registrada. Una nueva versión reemplaza a la anterior pendiente y conserva su historial. No prometas resultados judiciales.
              </p>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Enviar propuesta <ArrowRight size={16} />
              </button>
            </form>
          )}

          {modal === 'accept' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => action('accept', { proposal_id: selected!.id, understood: true }));
              }}
            >
              <div className="notice-panel">
                <strong>{name(selected!.lawyer_id)}</strong>
                <p>{money(selected!.amount)}</p>
                <p>{selected!.scope}</p>
              </div>
              <p>
                Las demás propuestas quedarán cerradas y se retirará el acceso de los otros profesionales. El precio y el alcance quedan registrados.
              </p>
              <label className="checkbox-line">
                <input type="checkbox" required />
                <span>
                  Entiendo que debo confirmar el encargo con el abogado y otorgar el poder que corresponda. Elegir una propuesta no presenta documentos ni realiza un pago.
                </span>
              </label>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Elegir y continuar <ArrowRight size={16} />
              </button>
            </form>
          )}

          {modal === 'ai' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await action('organize', { consent: true });
                  onNotice('Estamos preparando una sugerencia. Puedes seguir usando tu espacio.');
                });
              }}
            >
              <p>
                Se enviará a OpenAI el relato privado y el texto extraído de los documentos disponibles. La IA propondrá una categoría, hechos, preguntas y un resumen. Nada se publicará automáticamente.
              </p>
              <p className="microcopy">
                Solo se incluyen archivos que ya terminaron de prepararse. Si alguno sigue pendiente, podrás volver a intentarlo después.
              </p>
              <label className="checkbox-line">
                <input type="checkbox" required />
                <span>Autorizo este procesamiento de la información y revisaré la sugerencia antes de usarla.</span>
              </label>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                <Sparkles size={16} /> Preparar sugerencia
              </button>
            </form>
          )}

          {modal === 'event' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => action('events', Object.fromEntries(new FormData(e.currentTarget))));
              }}
            >
              <Field label="Qué ha avanzado">
                <select name="title">
                  {['Encargo confirmado', 'Revisión en curso', 'Documentos ajustados', 'Actuación presentada', 'Novedad del proceso'].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </Field>
              <Field label="Detalle para el cliente">
                <textarea
                  name="detail"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  placeholder="Describe la novedad. Si hubo radicación, incluye autoridad, fecha y número, y adjunta el comprobante en Documentos."
                />
              </Field>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Registrar actualización
              </button>
            </form>
          )}

          {modal === 'close' && (
            <div className="close-case-modal-box">
              <p>
                El espacio pasará a cerrado. Podrás consultar lo registrado y valorar la experiencia. Confirma previamente con el abogado el estado del encargo y cualquier obligación pendiente.
              </p>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={() => run(() => action('close'))}
              >
                Cerrar acompañamiento
              </button>
            </div>
          )}

          {modal === 'review' && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(() =>
                  action('reviews', {
                    rating: Number(f.get('rating')),
                    comment: f.get('comment')
                  })
                );
              }}
            >
              <Field label="Tu valoración">
                <select name="rating">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} de 5
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Qué destacarías"
                hint="El comentario será visible en el perfil. No incluyas datos del expediente ni nombres de terceros."
              >
                <textarea name="comment" required minLength={10} maxLength={1000} />
              </Field>
              <button type="submit" className="button button-burgundy" disabled={busy}>
                Publicar valoración
              </button>
            </form>
          )}

          {modal === 'professional' && professional && (
            <div className="professional-profile-modal-box">
              <div className="professional-modal-header">
                <span className="avatar-circle large">{professional.profile.name.slice(0, 1)}</span>
                <div>
                  <h3>{professional.profile.name}</h3>
                  <p>{professional.profile.city}</p>
                  <span className="case-pill status-pill">
                    <ShieldCheck size={14} />
                    {statusLabels[professional.profile.verification]}
                  </span>
                </div>
              </div>
              <p>{professional.profile.bio || 'Este profesional todavía no ha agregado una presentación.'}</p>
              <div className="professional-specialties-row">
                {professional.profile.specialties.map((s: string) => (
                  <span className="case-pill category-pill" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <p className="microcopy">
                Verificación de habilitación
                {professional.profile.verified_at
                  ? ' revisada el ' + date(professional.profile.verified_at)
                  : ' pendiente'}
                . No es una certificación de especialidad ni una garantía de resultados.
              </p>
              <h3>Experiencias de clientes</h3>
              {professional.reviews.length ? (
                professional.reviews.map((r: Row, i: number) => (
                  <div className="review-box" key={i}>
                    <b>{r.rating} / 5</b>
                    <p>{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="muted-notice">
                  Todavía no hay valoraciones. Solo pueden valorar clientes que hayan cerrado un acompañamiento en la plataforma.
                </p>
              )}
            </div>
          )}

          {modal === 'delete-file' && (
            <div className="delete-modal-box">
              <p>
                Se eliminará <b>{selected!.name}</b> del expediente. Esta acción no elimina copias descargadas anteriormente.
              </p>
              <button
                type="button"
                className="button danger-bg"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api('documents/' + selected!.id, 'DELETE');
                    await refresh();
                    setModal('');
                  })
                }
              >
                Eliminar documento
              </button>
            </div>
          )}

          {modal === 'delete-case' && (
            <div className="delete-modal-box">
              <p>Se eliminarán este borrador y sus archivos. Esta acción no se puede deshacer.</p>
              <button
                type="button"
                className="button danger-bg"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api('cases/' + id, 'DELETE');
                    setModal('');
                    props.onBack();
                  })
                }
              >
                Eliminar borrador
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
