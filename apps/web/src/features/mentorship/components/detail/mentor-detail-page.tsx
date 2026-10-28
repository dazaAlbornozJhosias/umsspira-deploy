'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { useMentorDetail } from '../../hooks/use-mentor-detail';
import { MentorDetailTabs } from './mentor-detail-tabs';
import { MentorDetailHeader } from './mentor-detail-header';
import { MentorDetailInfo } from './mentor-detail-info';
import { MentorDetailAvailability } from './mentor-detail-availability';
import {
  MentorDetailError,
  MentorDetailNotFound,
  MentorDetailSkeleton,
} from './mentor-detail-states';

export function MentorDetailPage({ mentorId }: { mentorId: string }) {
  const { mentor, loading, error, notFound, sessionRequired, retry } =
    useMentorDetail(mentorId);

  return (
    <main className="mentorship-shell mentor-detail-shell">
      {/* 1. Pestañas del módulo (presentes en todas las pantallas) */}
      <MentorDetailTabs />

      {/* 2. Estado de Perfil no disponible / inexistente (Mockup 5: sin breadcrumbs ni título) */}
      {notFound ? (
        <MentorDetailNotFound />
      ) : error ? (
        <MentorDetailError
          message={error}
          onRetry={retry}
          loginRequired={sessionRequired}
        />
      ) : (
        <>
          {/* Breadcrumbs de navegación */}
          <nav className="mentorship-breadcrumb" aria-label="Ruta de navegación">
            <ol className="breadcrumb-list">
              <li>
                <Link href="/" className="breadcrumb-link">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/mentorship" className="breadcrumb-link">
                  Mentorías
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/mentorship/directory" className="breadcrumb-link">
                  Directorio de mentores
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="breadcrumb-current" aria-current="page">
                Perfil del mentor
              </li>
            </ol>
          </nav>

          {/* Barra superior con título y botón para regresar al directorio */}
          <header className="mentor-detail-page-header">
            <h1 className="mentor-detail-page-heading">Perfil del mentor</h1>
            <div className="mentor-detail-back-action">
              <Link
                href="/mentorship/directory"
                className="mentor-button mentor-button-secondary"
                aria-label="Volver al directorio de mentores"
              >
                <ArrowLeftIcon className="icon" aria-hidden="true" />
                Volver al directorio
              </Link>
            </div>
          </header>

          {loading || !mentor ? (
            <MentorDetailSkeleton />
          ) : (
            <div className="mentor-detail-content">
              {/* Tarjeta de cabecera del mentor */}
              <MentorDetailHeader mentor={mentor} />

              {/* Contenido en dos columnas: izquierda información, derecha disponibilidad */}
              <div className="mentor-detail-layout">
                <MentorDetailInfo mentor={mentor} />
                <MentorDetailAvailability mentor={mentor} />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
