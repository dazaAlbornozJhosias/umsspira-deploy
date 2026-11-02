'use client';

import Link from 'next/link';
import { Loader2Icon } from 'lucide-react';
import { useMentorDirectory } from '../../hooks/use-mentor-directory';
import { emptyDirectoryFilters } from '../../model/mentor-directory';
import { MentorDirectoryCard } from './mentor-directory-card';
import { MentorDirectoryFilters } from './mentor-directory-filters';
import { DirectoryEmpty, DirectoryError, DirectorySkeletons } from './mentor-directory-states';

export function MentorDirectoryPage() {
  const directory = useMentorDirectory();
  const filtered = !!(directory.filters.areaIds.length || directory.filters.topicIds.length);
  const empty = !directory.loading && !directory.error && directory.total === 0 && !filtered;
  const status = directory.loading ? 'Buscando mentores...'
    : directory.error ? 'No se pudo cargar el directorio'
    : `${directory.total} ${directory.total === 1 ? 'mentor encontrado' : 'mentores encontrados'}`;

  return <main className="mentorship-shell directory-shell">
    <nav className="mentorship-breadcrumb" aria-label="Ruta de navegación"><ol className="breadcrumb-list">
      <li><Link href="/" className="breadcrumb-link">Inicio</Link></li><li aria-hidden="true">/</li>
      <li><Link href="/mentorship" className="breadcrumb-link">Mentorías</Link></li><li aria-hidden="true">/</li>
      <li className="breadcrumb-current" aria-current="page">Directorio de mentores</li>
    </ol></nav>
    <header className="directory-header"><h1>Directorio de mentores</h1>
      <p>Encuentra profesionales de la comunidad UMSS que pueden orientarte en tu desarrollo académico y profesional.</p>
    </header>
    <div className={`directory-layout ${empty ? 'directory-layout-empty' : ''}`}>
      {!empty && <MentorDirectoryFilters catalog={directory.catalog} applied={directory.filters} interestsSupported={directory.interestsSupported} disabled={directory.loading} onApply={directory.applyFilters} />}
      <section aria-label="Resultados del directorio" className="directory-results" aria-busy={directory.loading || directory.loadingMore}>
        <p className={empty ? 'sr-only' : 'directory-result-count'} role="status" aria-live="polite">{status}</p>
        {directory.loading ? <div className="directory-grid"><DirectorySkeletons /></div>
          : directory.error ? <DirectoryError message={directory.error} loginRequired={directory.sessionRequired} onRetry={directory.retry} />
          : directory.total === 0 ? <DirectoryEmpty filtered={filtered} onClear={() => directory.applyFilters(emptyDirectoryFilters())} />
          : <>
            <div className="directory-grid">{directory.mentors.map(mentor => <MentorDirectoryCard key={mentor.id} mentor={mentor} />)}
              {directory.loadingMore && <DirectorySkeletons count={3} />}
            </div>
            <div className="directory-pagination">
              <p>Mostrando {directory.mentors.length} de {directory.total} {directory.total === 1 ? 'mentor' : 'mentores'}</p>
              {directory.moreError && <p role="alert">{directory.moreError}</p>}
              {directory.hasMore && <button className="mentor-button mentor-button-secondary" type="button" disabled={directory.loadingMore} onClick={() => void directory.loadMore()}>
                {directory.loadingMore && <Loader2Icon className="icon mentor-button-spinner" aria-hidden="true" />}
                {directory.loadingMore ? 'Cargando mentores...' : directory.moreError ? 'Reintentar cargar más mentores' : 'Cargar más mentores'}
              </button>}
              {!directory.hasMore && <p className="directory-end-message">Ya viste todos los mentores disponibles.</p>}
              {directory.loadingMore && <p role="status" className="sr-only">Cargando más mentores...</p>}
            </div>
          </>}
      </section>
    </div>
  </main>;
}
