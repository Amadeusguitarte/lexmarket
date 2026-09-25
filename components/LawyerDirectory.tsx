'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, ArrowLeft } from 'lucide-react';
import LawyerCard, { type LawyerData } from './LawyerCard';
import { SEED_FEATURED_LAWYERS } from '@/lib/lawyers';
import { lawyerCategories } from '@/lib/shared';

export default function LawyerDirectory({
  onViewProfile,
  onInvite,
}: {
  onViewProfile: (id: string) => void;
  onInvite: (lawyer: LawyerData) => void;
}) {
  const [lawyers, setLawyers] = useState<LawyerData[]>(SEED_FEATURED_LAWYERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [virtualOnly, setVirtualOnly] = useState(false);
  const [inPersonOnly, setInPersonOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/professionals')
      .then(res => res.json())
      .then(data => {
        if (active) {
          if (data.items && data.items.length > 0) {
            setLawyers(data.items);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filtering & Sorting logic
  let filtered = lawyers.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const text = [l.name, l.city, l.bio, ...(l.specialties || [])].join(' ').toLowerCase();
      if (!text.includes(q)) return false;
    }

    if (category) {
      const catLower = category.toLowerCase();
      const matchesSpecialty = l.specialties?.some(s => s.toLowerCase().includes(catLower.replace('derecho ', '')));
      if (!matchesSpecialty) return false;
    }

    if (city && !l.city.toLowerCase().includes(city.toLowerCase())) {
      return false;
    }

    if (virtualOnly && l.virtual_available === false) return false;
    if (inPersonOnly && l.in_person_available === false) return false;

    if (experience) {
      const exp = l.years_of_experience || 0;
      if (experience === '1-5' && (exp < 1 || exp > 5)) return false;
      if (experience === '5-10' && (exp < 5 || exp > 10)) return false;
      if (experience === '10+' && exp < 10) return false;
    }

    if (ratingFilter) {
      const r = l.rating || 5;
      if (ratingFilter === '4.5' && r < 4.5) return false;
      if (ratingFilter === '4.8' && r < 4.8) return false;
    }

    return true;
  });

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'reviews') {
      return (b.review_count || 0) - (a.review_count || 0);
    }
    if (sortBy === 'experience') {
      return (b.years_of_experience || 0) - (a.years_of_experience || 0);
    }
    // Default 'recommended': featured first, then rating
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  return (
    <div className="directory-container">
      <header className="directory-header">
        <div className="wrap">
          <a href="/" className="back-link">
            <ArrowLeft size={16} /> Volver al inicio
          </a>
          <h1>Encuentra el abogado adecuado para tu caso</h1>
          <p>Compara experiencia, especialidad, ubicación y opiniones de otros clientes.</p>

          <div className="directory-search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Busca por especialidad, nombre o ciudad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Busca por especialidad, nombre o ciudad"
            />
          </div>
        </div>
      </header>

      <main className="wrap directory-main">
        <div className="directory-filters-bar">
          <div className="filter-group">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Área del derecho"
            >
              <option value="">Todas las áreas del derecho</option>
              {lawyerCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              aria-label="Ciudad"
            >
              <option value="">Todas las ciudades</option>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
              <option value="Cali">Cali</option>
              <option value="Barranquilla">Barranquilla</option>
              <option value="Bucaramanga">Bucaramanga</option>
              <option value="Cartagena">Cartagena</option>
            </select>

            <select
              value={experience}
              onChange={e => setExperience(e.target.value)}
              aria-label="Experiencia"
            >
              <option value="">Cualquier experiencia</option>
              <option value="1-5">1 - 5 años de experiencia</option>
              <option value="5-10">5 - 10 años de experiencia</option>
              <option value="10+">Más de 10 años</option>
            </select>

            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              aria-label="Calificación"
            >
              <option value="">Todas las calificaciones</option>
              <option value="4.5">4.5+ ★</option>
              <option value="4.8">4.8+ ★</option>
            </select>
          </div>

          <div className="filter-options">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={virtualOnly}
                onChange={e => setVirtualOnly(e.target.checked)}
              />
              <span>Atención virtual</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={inPersonOnly}
                onChange={e => setInPersonOnly(e.target.checked)}
              />
              <span>Atención presencial</span>
            </label>

            <div className="sort-group">
              <span>Ordenar por:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                aria-label="Ordenar resultados"
              >
                <option value="recommended">Recomendados</option>
                <option value="rating">Mejor calificados</option>
                <option value="reviews">Más reseñas</option>
                <option value="experience">Mayor experiencia</option>
              </select>
            </div>
          </div>
        </div>

        <div className="directory-results-count">
          <span>Mostrando {filtered.length} abogados verificados</span>
        </div>

        {loading ? (
          <div className="directory-skeleton">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="lawyer-grid">
            {filtered.map(lawyer => (
              <LawyerCard
                key={lawyer.id}
                lawyer={lawyer}
                onViewProfile={onViewProfile}
                onInvite={onInvite}
              />
            ))}
          </div>
        ) : (
          <div className="directory-empty-state">
            <ShieldCheck size={40} className="empty-icon" />
            <h3>No encontramos abogados con los filtros seleccionados</h3>
            <p>Intenta ajustar la búsqueda, borrar algunos filtros o buscar por otra ciudad.</p>
            <button
              type="button"
              className="button outline"
              onClick={() => {
                setSearch('');
                setCategory('');
                setCity('');
                setExperience('');
                setRatingFilter('');
                setVirtualOnly(false);
                setInPersonOnly(false);
              }}
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
