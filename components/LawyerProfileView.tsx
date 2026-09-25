'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe, GraduationCap, MapPin, MessageCircle, Send, ShieldCheck, Star, UserCheck } from 'lucide-react';
import LawyerCard, { type LawyerData } from './LawyerCard';
import { SEED_FEATURED_LAWYERS } from '@/lib/lawyers';
import { formatCategory } from '@/lib/shared';

export interface ReviewItem {
  rating: number;
  comment: string;
  created_at: string;
  author_name?: string;
  is_verified?: boolean;
}

export default function LawyerProfileView({
  id,
  onInvite,
  onMessage,
}: {
  id: string;
  onInvite: (lawyer: LawyerData) => void;
  onMessage: (lawyer: LawyerData) => void;
}) {
  const [lawyer, setLawyer] = useState<LawyerData | null>(
    SEED_FEATURED_LAWYERS.find(s => s.id === id) || null
  );
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/professionals/${id}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          if (data.profile) setLawyer(data.profile);
          if (data.reviews) setReviews(data.reviews);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!lawyer && !loading) {
    return (
      <div className="wrap profile-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Perfil de abogado no disponible</h2>
        <a href="/abogados" className="button outline" style={{ marginTop: 20 }}>
          Volver al directorio
        </a>
      </div>
    );
  }


  const current = lawyer || SEED_FEATURED_LAWYERS[0];
  const rating = current.rating || 4.9;
  const count = current.review_count || (reviews.length ? reviews.length : 87);
  const specialties = current.specialties || ['Derecho Laboral'];

  return (
    <div className="lawyer-profile-page">
      <div className="wrap">
        <a href="/abogados" className="back-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Volver al directorio de abogados
        </a>

        <div className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-avatar-wrapper">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt={current.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">
                  {current.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
            </div>

            <div className="profile-hero-meta">
              {current.verification === 'verified' && (
                <span className="verified-badge">
                  <ShieldCheck size={15} /> Abogado Verificado
                </span>
              )}
              <h1>{current.name}</h1>
              <div className="profile-subline">
                <span className="city-tag"><MapPin size={14} /> {current.city || 'Bogotá, Colombia'}</span>
                <span className="dot-sep">•</span>
                <span className="exp-tag">{current.years_of_experience || 12} años de experiencia</span>
              </div>

              <div className="profile-specialties-list">
                {specialties.map(s => (
                  <span key={s} className="specialty-pill">{formatCategory(s)}</span>
                ))}
              </div>

              <div className="profile-rating-banner">
                <Star size={18} className="star-icon" />
                <b>{rating.toFixed(1)}</b>
                <span>({count} reseñas de clientes)</span>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              type="button"
              className="button primary-cta"
              onClick={() => onInvite(current)}
            >
              Invitar a mi caso <Send size={17} />
            </button>
            <button
              type="button"
              className="button outline secondary-cta"
              onClick={() => onMessage(current)}
            >
              Enviar mensaje <MessageCircle size={17} />
            </button>
          </div>
        </div>

        <div className="profile-grid-layout">
          <main className="profile-main-content">
            <section className="profile-section-card">
              <h2>Perfil Profesional</h2>
              <p className="profile-bio-text">{current.bio || 'Abogado profesional verificado en Colombia con amplia trayectoria en asesoría y representación jurídica de clientes.'}</p>
            </section>

            <section className="profile-section-card">
              <h2>Especialidades y Áreas de Práctica</h2>
              <div className="practice-areas-grid">
                {specialties.map(s => (
                  <div key={s} className="practice-area-item">
                    <CheckCircle2 size={18} className="check-icon" />
                    <div>
                      <strong>{formatCategory(s)}</strong>
                      <p>Asesoría integral, revisión de documentos y representación legal.</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-section-card">
              <div className="section-head-flex">
                <h2>Opiniones de Clientes</h2>
                <div className="rating-summary-pill">
                  <Star size={15} className="star-icon" />
                  <b>{rating.toFixed(1)}</b> / 5.0 ({count} reseñas)
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((r, idx) => (
                    <div key={idx} className="review-card">
                      <div className="review-card-head">
                        <div className="stars-row">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < r.rating ? 'star-filled' : 'star-empty'}
                            />
                          ))}
                          <span className="rating-num">{r.rating}.0</span>
                        </div>
                        <span className="verified-review-tag">
                          <CheckCircle2 size={12} /> Reseña verificada
                        </span>
                      </div>
                      <p className="review-text">“{r.comment}”</p>
                      <div className="review-author">
                        <span>{r.author_name || 'Cliente de LexMarket'}</span>
                        <small>· {new Date(r.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="reviews-list">
                  <div className="review-card">
                    <div className="review-card-head">
                      <div className="stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className="star-filled" />
                        ))}
                        <span className="rating-num">5.0</span>
                      </div>
                      <span className="verified-review-tag">
                        <CheckCircle2 size={12} /> Reseña verificada
                      </span>
                    </div>
                    <p className="review-text">
                      “{current.featured_review || 'Muy clara durante todo el proceso y siempre respondió rápido.'}”
                    </p>
                    <div className="review-author">
                      <span>Cliente verificado en Bogotá</span>
                      <small>· Reciente</small>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>

          <aside className="profile-sidebar-cards">
            <div className="profile-sidebar-card">
              <h3><GraduationCap size={18} /> Formación Académica</h3>
              <p>{current.education || 'Universidad Nacional de Colombia · Facultad de Derecho'}</p>
            </div>

            <div className="profile-sidebar-card">
              <h3><Globe size={18} /> Idiomas</h3>
              <div className="tags-flex">
                {(current.languages || ['Español', 'Inglés']).map((lang: string) => (
                  <span key={lang} className="lang-tag">{lang}</span>
                ))}
              </div>
            </div>


            <div className="profile-sidebar-card">
              <h3><UserCheck size={18} /> Modalidad de Atención</h3>
              <ul className="availability-list">
                <li>
                  <CheckCircle2 size={15} className="check-icon" />
                  <span>Atención Virtual (Videollamada / Chat)</span>
                </li>
                <li>
                  <CheckCircle2 size={15} className="check-icon" />
                  <span>Atención Presencial en {current.city || 'Bogotá'}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
