'use client';
import { ShieldCheck, Star } from 'lucide-react';
import { formatCategory } from '@/lib/shared';

export interface LawyerData {
  id: string;
  name: string;
  city: string;
  bio?: string;
  specialties?: string[];
  verification: string;
  avatar_url?: string;
  years_of_experience?: number;
  education?: string;
  languages?: string[];
  virtual_available?: boolean;
  in_person_available?: boolean;
  rating?: number;
  review_count?: number;
  featured?: boolean;
  featured_review?: string;
}

export default function LawyerCard({
  lawyer,
  onViewProfile,
  onInvite,
}: {
  lawyer: LawyerData;
  onViewProfile: (id: string) => void;
  onInvite: (lawyer: LawyerData) => void;
}) {
  const primarySpecialty = lawyer.specialties?.[0]
    ? formatCategory(lawyer.specialties[0])
    : 'Derecho General';
  
  const rating = lawyer.rating ?? 4.9;
  const count = lawyer.review_count ?? 0;
  const exp = lawyer.years_of_experience || 8;
  const excerpt = lawyer.featured_review || lawyer.bio || 'Profesional verificado para asesoría y representación jurídica.';

  return (
    <article className="lawyer-card" aria-label={`Perfil de ${lawyer.name}`}>
      <div className="lawyer-card-badge">
        {lawyer.verification === 'verified' && (
          <span className="verified-tag">
            <ShieldCheck size={14} className="verified-icon" />
            <span>Verificado</span>
          </span>
        )}
      </div>

      <div className="lawyer-avatar-wrapper">
        {lawyer.avatar_url ? (
          <img
            src={lawyer.avatar_url}
            alt={`Foto de ${lawyer.name}`}
            className="lawyer-avatar-img"
          />
        ) : (
          <div className="lawyer-avatar-fallback">
            {lawyer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
        )}
      </div>

      <div className="lawyer-info">
        <h3 className="lawyer-name">{lawyer.name}</h3>
        <p className="lawyer-specialty">{primarySpecialty}</p>
        <p className="lawyer-city">{lawyer.city || 'Bogotá'}</p>
        <p className="lawyer-exp">{exp} años de experiencia</p>

        <div className="lawyer-rating">
          {count > 0 ? (
            <>
              <Star size={14} className="star-icon" />
              <b className="rating-score">{rating.toFixed(1)}</b>
              <span className="rating-count">· {count} reseñas</span>
            </>
          ) : (
            <span className="new-tag">Nuevo en la plataforma</span>
          )}
        </div>

        <p className="lawyer-excerpt">“{excerpt}”</p>
      </div>

      <div className="lawyer-actions">
        <button
          type="button"
          className="lawyer-btn outline"
          onClick={() => onViewProfile(lawyer.id)}
        >
          Ver perfil
        </button>
        <button
          type="button"
          className="lawyer-btn primary"
          onClick={() => onInvite(lawyer)}
        >
          Invitar a mi caso
        </button>
      </div>
    </article>
  );
}
