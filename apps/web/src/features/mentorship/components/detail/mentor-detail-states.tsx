import Link from 'next/link';
import { ArrowLeftIcon, CloudOffIcon, RotateCwIcon, SearchXIcon } from 'lucide-react';

export function MentorDetailSkeleton() {
  return (
    <div className="mentor-detail-skeleton-wrap" aria-busy="true" aria-live="polite">
      <p className="sr-only" role="status">
        Cargando perfil del mentor...
      </p>

      {/* Header Skeleton */}
      <div className="mentor-detail-header-card mentor-detail-skeleton" aria-hidden="true">
        <div className="mentor-detail-header-main">
          <div className="mentor-detail-header-info">
            <span className="mentor-detail-skeleton-avatar" />
            <div className="mentor-detail-skeleton-lines">
              <span className="mentor-detail-skeleton-line mentor-detail-skeleton-title" />
              <span className="mentor-detail-skeleton-line mentor-detail-skeleton-subtitle" />
              <span className="mentor-detail-skeleton-line mentor-detail-skeleton-desc" />
              <span className="mentor-detail-skeleton-line mentor-detail-skeleton-badge" />
            </div>
          </div>
          <div className="mentor-detail-header-action">
            <span className="mentor-detail-skeleton-button" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="mentor-detail-layout" aria-hidden="true">
        <div className="mentor-detail-info-column">
          <div className="mentor-detail-card mentor-detail-skeleton">
            <span className="mentor-detail-skeleton-line mentor-detail-skeleton-card-title" />
            <span className="mentor-detail-skeleton-line mentor-detail-skeleton-text-block" />
          </div>
          <div className="mentor-detail-card mentor-detail-skeleton">
            <span className="mentor-detail-skeleton-line mentor-detail-skeleton-card-title" />
            <span className="mentor-detail-skeleton-line mentor-detail-skeleton-text-block" />
          </div>
          <div className="mentor-detail-card mentor-detail-skeleton">
            <span className="mentor-detail-skeleton-line mentor-detail-skeleton-card-title" />
            <div className="mentor-detail-skeleton-pills">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <div className="mentor-detail-card mentor-detail-skeleton mentor-detail-availability-card">
          <span className="mentor-detail-skeleton-line mentor-detail-skeleton-card-title" />
          <span className="mentor-detail-skeleton-line mentor-detail-skeleton-subtitle" />
          <div className="mentor-detail-skeleton-slots">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}

const NOT_FOUND_COPY = {
  // El API responde igual a un perfil inexistente y a uno No disponible (CA-NF-14),
  // por eso el texto no afirma que el perfil haya existido.
  missing: {
    title: 'Perfil no encontrado',
    description: 'El perfil que buscas no existe o no está disponible.',
  },
  invalid: {
    title: 'El enlace del perfil no es válido',
    description: 'Revisa la dirección o vuelve al directorio para elegir un mentor.',
  },
};

/**
 * Pantalla de perfil no encontrado o de enlace no válido (Mockup 5 de Figma).
 * Se presenta centrada con fondo blanco, sin breadcrumb ni título.
 */
export function MentorDetailNotFound({ reason = 'missing' }: { reason?: keyof typeof NOT_FOUND_COPY }) {
  const copy = NOT_FOUND_COPY[reason];
  return (
    <div className="mentor-detail-not-found-container">
      <div className="mentor-detail-state-card" role="region" aria-label={copy.title}>
        <div className="mentor-detail-state-icon-circle" aria-hidden="true">
          <SearchXIcon className="mentor-detail-state-icon" />
        </div>
        <h1 className="mentor-detail-state-title">{copy.title}</h1>
        <p className="mentor-detail-state-description">{copy.description}</p>
        <div className="mentor-detail-state-actions">
          <Link
            href="/mentorship/directory"
            className="mentor-button mentor-button-secondary"
          >
            <ArrowLeftIcon className="icon" aria-hidden="true" />
            Volver al directorio
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Mientras se redirige al inicio de sesión no se muestra el perfil ni un error (CA-FE-16). */
export function MentorDetailSessionRedirect() {
  return (
    <p className="sr-only" role="status">
      Redirigiendo al inicio de sesión...
    </p>
  );
}

export function MentorDetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mentor-detail-not-found-container">
      <div className="mentor-detail-state-card" role="alert">
        <div className="mentor-detail-state-icon-circle mentor-detail-state-error-circle" aria-hidden="true">
          <CloudOffIcon className="mentor-detail-state-icon" />
        </div>
        <h2 className="mentor-detail-state-title">No pudimos cargar el perfil del mentor</h2>
        <p className="mentor-detail-state-description">
          Ocurrió un problema al consultar el perfil del mentor. Revisa tu conexión e inténtalo nuevamente.
        </p>
        <div className="mentor-detail-state-actions">
          <button
            type="button"
            className="mentor-button mentor-button-primary"
            onClick={onRetry}
          >
            <RotateCwIcon className="icon" aria-hidden="true" />
            Reintentar
          </button>
          <Link href="/mentorship/directory" className="mentor-button mentor-button-secondary">
            <ArrowLeftIcon className="icon" aria-hidden="true" />
            Volver al directorio
          </Link>
        </div>
      </div>
    </div>
  );
}
