'use client';

import { useState, useEffect } from 'react';
import { api, browserDB } from '@/lib/browser';
import { statusLabels } from '@/lib/shared';
import { 
  ShieldCheck, 
  FolderOpen, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Database, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  UserCheck, 
  History, 
  ChevronRight, 
  Lock, 
  Eye, 
  X,
  Server,
  Layers,
  Calendar,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';

export interface AdminCase {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  city: string;
  service: string;
  urgency?: string;
  status: string;
  description: string;
  public_summary: string;
  counterparty?: string;
  moderation_note?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  owner?: {
    id: string;
    name: string;
    city: string;
    role: string;
  } | null;
}

export interface AdminDocument {
  id: string;
  case_id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
  state: 'clean' | 'quarantine' | 'failed' | 'blocked';
  created_at: string;
  extraction_note?: string;
  case?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface AdminStats {
  totalCases: number;
  pendingReview: number;
  published: number;
  draft: number;
  totalDocuments: number;
  pendingLawyers: number;
  storageBucket: string;
}

export default function AdminDashboard({ onNotice }: { onNotice?: (s: string) => void }) {
  const [activeTab, setActiveTab] = useState<'cases' | 'documents' | 'lawyers' | 'storage' | 'audit'>('cases');
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Data states
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalCases: 0,
    pendingReview: 0,
    published: 0,
    draft: 0,
    totalDocuments: 0,
    pendingLawyers: 0,
    storageBucket: 'case-files'
  });
  const [storageInfo, setStorageInfo] = useState<{ exists?: boolean; totalFiles?: number; ready?: boolean } | null>(null);

  // Selected Case Modal
  const [inspectCaseId, setInspectCaseId] = useState<string | null>(null);
  const [inspectCaseData, setInspectCaseData] = useState<{
    case: AdminCase;
    owner: any;
    documents: AdminDocument[];
    audit: any[];
    events: any[];
  } | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [modNote, setModNote] = useState('');

  const notify = (msg: string) => {
    setToastMsg(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('admin');
      if (data) {
        setCases(data.cases || []);
        setDocuments(data.documents || []);
        setProfiles(data.profiles || []);
        setAuditLog(data.audit || []);
        if (data.stats) setStats(data.stats);
      }
      // Check storage status
      try {
        const s = await api('admin/storage');
        setStorageInfo(s);
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Error cargando datos administrativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openInspectCase = async (id: string) => {
    setInspectCaseId(id);
    setInspectLoading(true);
    setModNote('');
    try {
      const res = await api('admin/cases/' + id);
      setInspectCaseData(res);
      if (res.case?.moderation_note) {
        setModNote(res.case.moderation_note);
      }
    } catch (err: any) {
      notify('Error al cargar expediente: ' + err.message);
      setInspectCaseId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const executeCaseAction = async (action: 'approve' | 'request_changes' | 'reject' | 'pause' | 'close') => {
    if (!inspectCaseId) return;
    setActionBusy(true);
    try {
      await api('admin/cases/' + inspectCaseId, 'PATCH', {
        action,
        note: modNote.trim() || undefined
      });
      notify('Decisión registrada con éxito.');
      setInspectCaseId(null);
      setInspectCaseData(null);
      await loadData();
    } catch (err: any) {
      notify('Error: ' + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDownloadDoc = async (docId: string, filename: string) => {
    try {
      notify('Iniciando descarga segura de Supabase…');
      const { data } = await browserDB()!.auth.getSession();
      const res = await fetch('/api/admin/documents/' + docId, {
        headers: { Authorization: 'Bearer ' + data.session?.access_token }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo descargar el archivo.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify('Archivo descargado correctamente.');
    } catch (err: any) {
      notify('Error al descargar: ' + err.message);
    }
  };

  const handleDocumentStateChange = async (docId: string, newState: 'clean' | 'quarantine' | 'failed') => {
    setActionBusy(true);
    try {
      await api('admin/documents/' + docId + '/state', 'POST', { state: newState });
      notify('Estado del documento actualizado a ' + newState);
      if (inspectCaseId) {
        openInspectCase(inspectCaseId);
      }
      loadData();
    } catch (err: any) {
      notify('Error al actualizar estado: ' + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleInitStorage = async () => {
    setActionBusy(true);
    try {
      const res = await api('admin/storage/init', 'POST');
      if (res.ok) {
        notify('Infraestructura de Supabase verificada: Bucket "case-files" activo y asegurado.');
        const s = await api('admin/storage');
        setStorageInfo(s);
      }
    } catch (err: any) {
      notify('Error verificando storage: ' + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleModerateLawyer = async (lawyerId: string, decision: 'verified' | 'rejected', note: string) => {
    setActionBusy(true);
    try {
      await api('admin/' + lawyerId, 'PATCH', { verification: decision, note });
      notify('Estado del profesional actualizado.');
      loadData();
    } catch (err: any) {
      notify('Error: ' + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleFeatured = async (lawyerId: string, current: boolean) => {
    setActionBusy(true);
    try {
      await api('admin/' + lawyerId, 'PATCH', { featured: !current });
      notify('Estado destacado actualizado.');
      loadData();
    } catch (err: any) {
      notify('Error: ' + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesFilter = caseFilter === 'all' || c.status === caseFilter;
    const matchesQuery = !searchQuery || 
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="admin-console" style={{ paddingBottom: 60 }}>
      {/* Toast feedback */}
      {toastMsg && (
        <div className="toast" role="status" style={{ zIndex: 9999 }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')}><X size={15} /></button>
        </div>
      )}

      {/* Top Banner */}
      <div className="page-heading" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="overline" style={{ color: 'var(--purple)', fontWeight: 700, margin: 0 }}>
              CONSOLA DE ADMINISTRACIÓN · MATCHJURÍDICO
            </span>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 5, 
              fontSize: 11, 
              background: '#eef8f0', 
              color: '#27683b', 
              padding: '2px 8px', 
              borderRadius: 12, 
              fontWeight: 600 
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27683b' }} />
              Supabase Storage Activo
            </span>
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 6 }}>Supervisión y Aprobación</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Revisa expedientes, aprueba publicaciones en el marketplace y audita archivos alojados en Supabase Storage.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            className="button outline small" 
            onClick={loadData} 
            disabled={loading || actionBusy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 28 }}>
        <div style={{ background: stats.pendingReview > 0 ? '#fff8e8' : 'white', borderColor: stats.pendingReview > 0 ? '#e8c97e' : 'var(--line)' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            En revisión (Pendientes)
            {stats.pendingReview > 0 && <AlertCircle size={15} color="#b87b00" />}
          </span>
          <b style={{ color: stats.pendingReview > 0 ? '#996300' : 'var(--ink)' }}>{stats.pendingReview}</b>
          <small style={{ fontSize: 10, color: 'var(--muted)' }}>Requieren decisión del administrador</small>
        </div>

        <div>
          <span>Total Expedientes</span>
          <b>{stats.totalCases}</b>
          <small style={{ fontSize: 10, color: 'var(--muted)' }}>{stats.published} publicados · {stats.draft} borradores</small>
        </div>

        <div>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Archivos en Supabase
            <Database size={15} color="var(--purple)" />
          </span>
          <b>{stats.totalDocuments}</b>
          <small style={{ fontSize: 10, color: 'var(--muted)' }}>Bucket: {stats.storageBucket || 'case-files'}</small>
        </div>

        <div>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Abogados por Habilitar
            <UserCheck size={15} color="var(--purple)" />
          </span>
          <b>{stats.pendingLawyers}</b>
          <small style={{ fontSize: 10, color: 'var(--muted)' }}>Pendientes de verificación de T.P.</small>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button 
          className={activeTab === 'cases' ? 'active' : ''} 
          onClick={() => setActiveTab('cases')}
        >
          <FolderOpen size={16} />
          Expedientes y Casos <span>{cases.length}</span>
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''} 
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={16} />
          Archivos en Supabase <span>{documents.length}</span>
        </button>
        <button 
          className={activeTab === 'lawyers' ? 'active' : ''} 
          onClick={() => setActiveTab('lawyers')}
        >
          <UserCheck size={16} />
          Abogados y Habilitación <span>{profiles.filter(p => p.verification === 'pending').length}</span>
        </button>
        <button 
          className={activeTab === 'storage' ? 'active' : ''} 
          onClick={() => setActiveTab('storage')}
        >
          <Server size={16} />
          Infraestructura Storage
        </button>
        <button 
          className={activeTab === 'audit' ? 'active' : ''} 
          onClick={() => setActiveTab('audit')}
        >
          <History size={16} />
          Auditoría
        </button>
      </div>

      {error && (
        <div className="notice-panel error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* TAB 1: CASES & MODERATION */}
      {activeTab === 'cases' && (
        <section>
          {/* Filter Pills and Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Todos (${cases.length})` },
                { id: 'review', label: `En revisión · Pendientes (${cases.filter(c => c.status === 'review').length})` },
                { id: 'draft', label: `Borradores (${cases.filter(c => c.status === 'draft').length})` },
                { id: 'published', label: `Publicados (${cases.filter(c => c.status === 'published').length})` },
                { id: 'engaged', label: `En acompañamiento (${cases.filter(c => c.status === 'engaged').length})` },
                { id: 'closed', label: `Cerrados (${cases.filter(c => c.status === 'closed').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  className={'button small ' + (caseFilter === f.id ? '' : 'outline')}
                  onClick={() => setCaseFilter(f.id)}
                  style={{ fontSize: 12, padding: '6px 14px', minHeight: 34 }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="search" style={{ maxWidth: 450 }}>
              <Search size={16} />
              <input
                placeholder="Buscar por título, área legal, cliente o ciudad…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="notice-panel">Cargando expedientes…</p>
          ) : filteredCases.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FolderOpen size={36} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
              <h3>No hay casos en este filtro</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {searchQuery ? 'Prueba con otro término de búsqueda.' : 'No se encontraron expedientes con este estado.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {filteredCases.map(c => (
                <article 
                  key={c.id} 
                  className="panel" 
                  style={{ 
                    padding: 22, 
                    borderLeft: c.status === 'review' ? '4px solid #d49826' : c.status === 'published' ? '4px solid #287743' : '1px solid var(--line)',
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: '#f5effa', color: 'var(--purple-dark)', fontWeight: 600 }}>
                          {c.category}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {c.city || 'Colombia'}
                        </span>
                        {c.urgency === 'urgent' && (
                          <span style={{ background: '#fcebe8', color: '#a62e1b', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                            Urgente
                          </span>
                        )}
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontWeight: 600,
                          background: c.status === 'review' ? '#fff3d6' : c.status === 'published' ? '#eaf5ed' : '#f0edf4',
                          color: c.status === 'review' ? '#996000' : c.status === 'published' ? '#226938' : 'var(--muted)'
                        }}>
                          {statusLabels[c.status] || c.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 18, margin: '4px 0 8px', fontWeight: 600 }}>{c.title}</h3>
                      
                      {c.public_summary && (
                        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.public_summary}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>Cliente: <b>{c.owner?.name || 'Usuario ' + c.owner_id.slice(0, 8)}</b></span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={13} color="var(--purple)" />
                          <b>{c.document_count || 0}</b> archivos en Supabase
                        </span>
                        <span>Actualizado: {new Date(c.updated_at).toLocaleDateString('es-CO')}</span>
                      </div>

                      {c.moderation_note && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#fcf6ec', borderRadius: 8, fontSize: 11, color: '#805915' }}>
                          <b>Última nota de moderación:</b> {c.moderation_note}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      <button 
                        className="button small" 
                        onClick={() => openInspectCase(c.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={14} />
                        Revisar expediente
                      </button>

                      {c.status === 'review' && (
                        <button
                          className="button small outline"
                          onClick={() => {
                            openInspectCase(c.id);
                          }}
                          style={{ borderColor: '#2b7a48', color: '#2b7a48', fontSize: 11, padding: '6px 12px', minHeight: 32 }}
                        >
                          <Check size={13} /> Decidir publicación
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: DOCUMENTS IN SUPABASE STORAGE */}
      {activeTab === 'documents' && (
        <section>
          <div className="panel" style={{ marginBottom: 20, background: '#f9f6fc', borderColor: '#e3d7ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Repositorio de Archivos en Supabase Storage</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  Bucket privado: <code>case-files</code>. Todos los documentos subidos por usuarios y clientes se procesan y resguardan aquí.
                </p>
              </div>
              <button 
                className="button small outline" 
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw size={14} /> Actualizar lista
              </button>
            </div>
          </div>

          {loading ? (
            <p className="notice-panel">Cargando inventario de archivos…</p>
          ) : documents.length === 0 ? (
            <p className="notice-panel">No hay documentos registrados todavía.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {documents.map(d => (
                <article 
                  key={d.id} 
                  className="panel" 
                  style={{ padding: '16px 20px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                    <div style={{ 
                      width: 38, 
                      height: 38, 
                      borderRadius: 10, 
                      background: '#f2e9dc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--purple-dark)',
                      flexShrink: 0 
                    }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 13, display: 'block', overflowWrap: 'anywhere' }}>{d.name}</b>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        <span>{(d.size / 1024).toFixed(1)} KB</span>
                        <span>{d.mime}</span>
                        {d.case && (
                          <span style={{ color: 'var(--purple)' }}>
                            Caso: <b>{d.case.title}</b>
                          </span>
                        )}
                        <span>{new Date(d.created_at).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 10,
                      background: d.state === 'clean' ? '#eaf5ed' : d.state === 'failed' ? '#fdeced' : '#fff4db',
                      color: d.state === 'clean' ? '#226938' : d.state === 'failed' ? '#a32938' : '#8a5c00'
                    }}>
                      {d.state === 'clean' ? 'Disponible / Limpio' : d.state === 'quarantine' ? 'En proceso' : 'Error'}
                    </span>

                    <button
                      className="button small outline"
                      onClick={() => handleDownloadDoc(d.id, d.name)}
                      style={{ fontSize: 12, padding: '6px 12px', minHeight: 32 }}
                    >
                      <Download size={13} /> Descargar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: LAWYERS VERIFICATION */}
      {activeTab === 'lawyers' && (
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Profesionales Registrados</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {profiles.map(p => (
              <article key={p.id} className="panel" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>{p.name}</h3>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>
                      T.P. <b>{p.license || 'No informada'}</b> · {p.city} · 
                      <span style={{ 
                        marginLeft: 6,
                        fontWeight: 600, 
                        color: p.verification === 'verified' ? '#226938' : p.verification === 'pending' ? '#8a5c00' : '#a32938' 
                      }}>
                        {p.verification === 'verified' ? 'Habilitado' : p.verification === 'pending' ? 'Pendiente' : 'Requiere ajustes'}
                      </span>
                    </p>
                    <p style={{ fontSize: 13, margin: '6px 0', lineHeight: 1.6 }}>{p.bio || 'Sin descripción'}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {(p.specialties || []).map((s: string) => (
                        <span key={s} className="tag soft" style={{ fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <button
                      className={'button small ' + (p.featured ? '' : 'outline')}
                      onClick={() => handleToggleFeatured(p.id, !!p.featured)}
                      style={{ fontSize: 11, minHeight: 32 }}
                    >
                      {p.featured ? '★ Destacado' : '☆ Marcar destacado'}
                    </button>
                  </div>
                </div>

                {p.verification_note && (
                  <p className="notice-panel" style={{ margin: '14px 0 0', fontSize: 11 }}>
                    <b>Última revisión:</b> {p.verification_note}
                  </p>
                )}

                {/* Moderation Form */}
                <form 
                  style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}
                  onSubmit={e => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const dec = form.get('decision') as 'verified' | 'rejected';
                    const note = form.get('note') as string;
                    if (dec && note) {
                      handleModerateLawyer(p.id, dec, note);
                    }
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Decisión:</label>
                      <select name="decision" required defaultValue={p.verification === 'verified' ? 'verified' : ''} style={{ fontSize: 12 }}>
                        <option value="" disabled>Seleccionar…</option>
                        <option value="verified">Aprobar habilitación</option>
                        <option value="rejected">Pedir ajustes / rechazar</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Motivo / Comprobación:</label>
                      <input 
                        name="note" 
                        required 
                        minLength={10} 
                        maxLength={2000} 
                        placeholder="Fuente oficial consultada, fecha o ajustes requeridos…" 
                        style={{ fontSize: 12 }}
                      />
                    </div>
                    <button className="button small" disabled={actionBusy} style={{ minHeight: 40 }}>
                      Guardar
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: SUPABASE STORAGE INFRASTRUCTURE */}
      {activeTab === 'storage' && (
        <section>
          <div className="panel" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f2e9dc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                <Server size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>Infraestructura de Supabase Storage</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Configuración y conectividad del bucket de archivos</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#faf6f0', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>Bucket Principal:</span>
                <code style={{ fontSize: 13, fontWeight: 700 }}>case-files</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#faf6f0', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>Nivel de Acceso:</span>
                <span style={{ fontSize: 13, color: '#226938', fontWeight: 600 }}>Privado (Proxied via API + Service Role)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#faf6f0', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>Límite por archivo:</span>
                <span style={{ fontSize: 13 }}>10 MB (validación MIME estricta)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#faf6f0', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>Formatos soportados:</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>PDF, DOCX, TXT, PNG, JPEG</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#faf6f0', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>Estado de Conexión:</span>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: storageInfo?.exists ? '#226938' : '#a32938' 
                }}>
                  {storageInfo?.exists ? '✓ Bucket case-files verificado y activo' : 'Bucket no verificado'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="button"
                onClick={handleInitStorage}
                disabled={actionBusy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <CheckCircle2 size={16} />
                Verificar y Asegurar Bucket en Supabase
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Historial de Decisiones y Auditoría</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {auditLog.map(a => (
              <article key={a.id} className="panel" style={{ padding: '16px 20px', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <b style={{ color: 'var(--purple-dark)', fontSize: 13 }}>{a.action}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(a.created_at).toLocaleString('es-CO')}
                  </span>
                </div>
                <p style={{ fontSize: 12, margin: '4px 0', color: 'var(--muted)' }}>
                  Actor: <code>{a.actor_id}</code> · Referencia: <code>{a.target_id}</code>
                </p>
                {a.note && (
                  <p style={{ fontSize: 12, margin: '6px 0 0', background: '#faf6f0', padding: '8px 12px', borderRadius: 8, overflowWrap: 'anywhere' }}>
                    {a.note}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CASE INSPECTION MODAL */}
      {inspectCaseId && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(30, 20, 35, 0.65)', 
            backdropFilter: 'blur(5px)', 
            zIndex: 9000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16 
          }}
          onClick={() => setInspectCaseId(null)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: 22, 
              width: '100%', 
              maxWidth: 880, 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: 30, 
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)', 
              position: 'relative' 
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setInspectCaseId(null)}
              style={{ position: 'absolute', right: 20, top: 20, border: 0, background: 'none', cursor: 'pointer', padding: 4 }}
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            {inspectLoading || !inspectCaseData ? (
              <p className="notice-panel">Cargando expediente completo…</p>
            ) : (
              <div>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="tag" style={{ background: '#f5effa', color: 'var(--purple-dark)' }}>
                      {inspectCaseData.case.category}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {inspectCaseData.case.city}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600,
                      background: inspectCaseData.case.status === 'review' ? '#fff3d6' : inspectCaseData.case.status === 'published' ? '#eaf5ed' : '#f0edf4',
                      color: inspectCaseData.case.status === 'review' ? '#996000' : inspectCaseData.case.status === 'published' ? '#226938' : 'var(--muted)'
                    }}>
                      {statusLabels[inspectCaseData.case.status] || inspectCaseData.case.status}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 24, margin: '4px 0 6px' }}>{inspectCaseData.case.title}</h2>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                    Cliente: <b>{inspectCaseData.owner?.name || inspectCaseData.case.owner_id}</b> · Creado: {new Date(inspectCaseData.case.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>

                {/* Private Narrative (Facts) */}
                <div style={{ background: '#fbf8f3', padding: 18, borderRadius: 14, marginBottom: 18, border: '1px solid var(--line)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={13} /> Relato Completo del Cliente (Información Privada)
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {inspectCaseData.case.description || 'Sin relato detallado.'}
                  </p>
                </div>

                {/* Public Marketplace Summary */}
                <div style={{ background: '#f9f6fc', padding: 18, borderRadius: 14, marginBottom: 20, border: '1px solid #e7ddf0' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--purple-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={13} /> Resumen para Abogados (Marketplace Público)
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {inspectCaseData.case.public_summary || 'No se ha definido resumen público.'}
                  </p>
                </div>

                {/* Attached Documents in Supabase */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={17} color="var(--purple)" />
                    Documentos Alojados en Supabase Storage ({inspectCaseData.documents.length})
                  </h3>

                  {inspectCaseData.documents.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Este caso no tiene archivos adjuntos.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {inspectCaseData.documents.map(doc => (
                        <div 
                          key={doc.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: '#faf6f0', 
                            borderRadius: 12,
                            gap: 12,
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <b style={{ fontSize: 13, display: 'block', overflowWrap: 'anywhere' }}>{doc.name}</b>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                              <span>{(doc.size / 1024).toFixed(1)} KB</span>
                              <span>{doc.mime}</span>
                              <span style={{ 
                                color: doc.state === 'clean' ? '#226938' : '#996000',
                                fontWeight: 600
                              }}>
                                {doc.state === 'clean' ? 'Disponible' : 'En cuarentena / procesando'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="button small"
                              onClick={() => handleDownloadDoc(doc.id, doc.name)}
                              style={{ fontSize: 11, padding: '6px 12px', minHeight: 32 }}
                            >
                              <Download size={13} /> Descargar de Supabase
                            </button>
                            {doc.state !== 'clean' && (
                              <button
                                className="button small outline"
                                onClick={() => handleDocumentStateChange(doc.id, 'clean')}
                                style={{ fontSize: 11, padding: '6px 10px', minHeight: 32 }}
                              >
                                Marcar disponible
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation Actions Box */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 10 }}>Decisión de Moderación</h3>
                  
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                      Observaciones / Motivo (visible para el cliente):
                    </label>
                    <textarea
                      value={modNote}
                      onChange={e => setModNote(e.target.value)}
                      placeholder="Explica qué verificaste o qué correcciones debe realizar el usuario…"
                      rows={3}
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="button"
                      disabled={actionBusy}
                      onClick={() => executeCaseAction('approve')}
                      style={{ background: '#226938', color: 'white' }}
                    >
                      <CheckCircle2 size={16} /> Aprobar y Publicar en Marketplace
                    </button>

                    <button
                      className="button outline"
                      disabled={actionBusy}
                      onClick={() => executeCaseAction('request_changes')}
                    >
                      <AlertTriangle size={15} /> Solicitar Ajustes
                    </button>

                    <button
                      className="button outline"
                      disabled={actionBusy}
                      onClick={() => executeCaseAction('pause')}
                    >
                      Pausar / Regresar a Borrador
                    </button>

                    <button
                      className="button outline"
                      disabled={actionBusy}
                      onClick={() => executeCaseAction('reject')}
                      style={{ borderColor: '#d3455b', color: '#a32938' }}
                    >
                      <XCircle size={15} /> Rechazar Publicación
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
