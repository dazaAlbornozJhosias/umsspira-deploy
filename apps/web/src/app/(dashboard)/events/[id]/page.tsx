'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EventItem } from '@umsspira/shared-types';
import { StatusChip } from '@/shared/components/events-ui';
import { getAdminEvent } from '@/shared/services/events-service';
import { useAuthenticatedUserId } from '@/modules/auth/frontend/components/authenticated-user-context';
import { formatEventDateTime as formatDateTime } from '@/shared/utils/event-date-time';

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthenticatedUserId();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!userId) {
      setErrorMessage('No hay un usuario autenticado disponible para consultar el evento.');
      setIsLoading(false);
      return () => { isActive = false; };
    }

    void getAdminEvent(id, userId)
      .then((loadedEvent) => {
        if (isActive) {
          setEvent(loadedEvent);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar el evento.',
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id, userId]);

  return (
    <main className="events-page admin-event-detail">
      {isLoading ? (
        <p role="status" className="events-list-footer">
          Cargando evento…
        </p>
      ) : errorMessage ? (
        <p role="alert" className="event-feedback">
          {errorMessage}
        </p>
      ) : event ? (
        <article className="admin-event-detail-card">
          <header>
            <div>
              <p>Detalle del evento</p>
              <h1>{event.title}</h1>
            </div>
            <StatusChip status={event.status} />
          </header>
          <div
            className={`admin-event-detail-cover ${event.imageUrl ? 'has-image' : ''}`}
            style={event.imageUrl ? {
              backgroundImage: `linear-gradient(90deg, rgba(22, 32, 44, .46), rgba(22, 32, 44, .1)), url("${event.imageUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {!event.imageUrl ? <span>{event.title}</span> : null}
          </div>
          <section>
            <h2>Descripción</h2>
            <p>{event.description || 'Sin descripción disponible.'}</p>
          </section>
          <dl>
            <div>
              <dt>Fecha de inicio</dt>
              <dd>{formatDateTime(event.startDate)}</dd>
            </div>
            <div>
              <dt>Fecha de finalización</dt>
              <dd>{formatDateTime(event.endDate)}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{event.location || 'Sin ubicación'}</dd>
            </div>
            <div>
              <dt>Cupo máximo</dt>
              <dd>{event.maxCapacity}</dd>
            </div>
            <div>
              <dt>Creado por</dt>
              <dd>{event.creatorName || 'Administrador'}</dd>
            </div>
            <div>
              <dt>Fecha de creación</dt>
              <dd>{formatDateTime(event.createdAt)}</dd>
            </div>
          </dl>
          <Link href="/events" className="event-button event-button-primary">
            Volver a gestión
          </Link>
        </article>
      ) : null}
    </main>
  );
}
