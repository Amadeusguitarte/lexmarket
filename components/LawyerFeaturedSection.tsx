'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import LawyerCard, { type LawyerData } from './LawyerCard';
import { SEED_FEATURED_LAWYERS } from '@/lib/lawyers';

export default function LawyerFeaturedSection({
  onViewProfile,
  onInvite,
}: {
  onViewProfile: (id: string) => void;
  onInvite: (lawyer: LawyerData) => void;
}) {
  const [lawyers, setLawyers] = useState<LawyerData[]>(SEED_FEATURED_LAWYERS);

  useEffect(() => {
    let active = true;
    fetch('/api/professionals?featured=true')
      .then(res => res.json())
      .then(data => {
        if (active && data.items && data.items.length > 0) {
          setLawyers(data.items.slice(0, 4));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="featured-lawyers-section" aria-label="Abogados destacados">
      <div className="wrap">
        <div className="featured-lawyers-heading">
          <h2>Abogados destacados</h2>
          <p>Explora abogados verificados, compara experiencia y conoce la opinión de otros clientes.</p>
        </div>

        <div className="lawyer-grid">
          {lawyers.slice(0, 4).map(lawyer => (
            <LawyerCard
              key={lawyer.id}
              lawyer={lawyer}
              onViewProfile={onViewProfile}
              onInvite={onInvite}
            />
          ))}
        </div>

        <div className="featured-lawyers-footer">
          <a href="/abogados" className="see-all-lawyers-link">
            Ver todos los abogados <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
