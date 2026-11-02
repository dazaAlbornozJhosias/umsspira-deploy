'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleAlert, Info } from 'lucide-react';
import type {
  EventParticipationStatus,
  MyEventRegistrationItem,
} from '@umsspira/shared-types';

import { cancelEventRegistration, getMyEventRegistrations } from '@/shared/services/events-service';
import { CancelRegistrationAction } from './cancel-registration-action';
import { CancellationSuccess } from './cancellation-success';
import { ApiClientError } from '@/shared/services/api-client';
import { SessionError } from '@/shared/services/auth-session';
import { formatEventCardSchedule } from '@/shared/utils/event-date-time';

type StatusFilter = 'all' | 'cancelled' | 'finished';
type Tone = 'active' | 'cancelled' | 'finished';

const STATUS_LABEL: Record<EventParticipationStatus, string> = {
  VIGENTE: 'CONFIRMADA',
  INSCRIPCION_CANCELADA: 'INSCRIPCIÓN CANCELADA',
  EVENTO_CANCELADO: 'EVENTO CANCELADO',
  FINALIZADO: 'FINALIZADO',
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'TODOS' },
  { value: 'cancelled', label: 'CANCELADOS' },
  { value: 'finished', label: 'FINALIZADOS' },
];

function toneOf(status: EventParticipationStatus): Tone {
  if (status === 'VIGENTE') return 'active';
  if (status === 'FINALIZADO') return 'finished';
  return 'cancelled';
}

function matchesFilter(item: MyEventRegistrationItem, filter: StatusFilter): boolean {
  if (filter === 'cancelled') return toneOf(item.participationStatus) === 'cancelled';
  if (filter === 'finished') return item.participationStatus === 'FINALIZADO';
  return true;
}

function countLabel(filter: StatusFilter, count: number): string {
  const one = count === 1;
  if (filter === 'cancelled') return `${count} ${one ? 'evento cancelado' : 'eventos cancelados'}`;
  if (filter === 'finished') return `${count} ${one ? 'evento finalizado' : 'eventos finalizados'}`;
  return `${count} ${one ? 'evento asociado a tu cuenta' : 'eventos asociados a tu cuenta'}`;
}

export default function MyEventsPage() {
  const [items, setItems] = useState<MyEventRegistrationItem[]>([]);
  const [cancelledEventTitle, setCancelledEventTitle] = useState<string | null>(null);
  const [conflictNotice, setConflictNotice] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'session' | 'forbidden' | 'unavailable' | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setConflictNotice(false);
    try {
      setItems(await getMyEventRegistrations());
      return true;
    } catch (error) {
      const status = error instanceof ApiClientError || error instanceof SessionError ? error.status : undefined;
      setLoadError(status === 401 ? 'session' : status === 403 ? 'forbidden' : 'unavailable');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function markCancelled(registrationId: string) {
    const selected = items.find((item) => item.id === registrationId);
    if (selected) setCancelledEventTitle(selected.event.title);
    setItems((current) => current.map((item) => item.id === registrationId
      ? {
          ...item,
          status: 'CANCELADA',
          participationStatus: 'INSCRIPCION_CANCELADA',
        }
      : item));
  }

  async function refreshAfterConflict() {
    if (await load()) setConflictNotice(true);
  }

  const visibleItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  if (cancelledEventTitle !== null) {
    return (
      <main className="hu2-catalog-page hu4-cancellation-confirmed-page">
        <div className="hu2-catalog-shell">
          <header className="hu2-catalog-header">
            <div className="hu2-catalog-heading">
              <h1>Mis eventos</h1>
              <p>Tu inscripción fue actualizada correctamente.</p>
            </div>
          </header>
          <CancellationSuccess
            eventTitle={cancelledEventTitle}
            onReturn={() => setCancelledEventTitle(null)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="hu2-catalog-page">
      <div className="hu2-catalog-shell">
        <header className="hu2-catalog-header">
          <div className="hu2-catalog-heading">
            <h1>Mis eventos</h1>
            <p>Revisa tus próximas participaciones y el estado de cada inscripción.</p>
          </div>
          <nav className="hu2-catalog-tabs" aria-label="Secciones de eventos">
            <Link href="/portal/eventos">Explorar</Link>
            <button type="button" className="is-active" aria-current="page">
              Mis eventos
            </button>
            <Link href="/mis-pases">
              Mis pases
            </Link>
          </nav>
        </header>

        {conflictNotice && !isLoading && !loadError ? (
          <p className="hu4-cancellation-note" role="status">
            La inscripción cambió o ya no admite cancelación. Mostramos el estado actualizado.
          </p>
        ) : null}
        {isLoading ? (
          <>
            <p className="hu2-results-count" role="status">
              Estamos recuperando tus próximas participaciones.
            </p>
            <div className="hu9-list" aria-hidden="true">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="hu9-skeleton-card" />
              ))}
            </div>
          </>
        ) : loadError ? (
          <section className="hu2-catalog-state hu2-error-state" role="alert">
            <span className="hu2-state-icon" aria-hidden="true">
              <CircleAlert size={52} />
            </span>
            <h2>{loadError === 'session' ? 'Inicia sesión para ver tus eventos'
              : loadError === 'forbidden' ? 'Esta sección requiere una cuenta de Titulado'
              : 'No pudimos cargar tus eventos'}</h2>
            <p>{loadError === 'session' ? 'Tu sesión no está disponible o ha expirado. Inicia sesión como Titulado para continuar.'
              : loadError === 'forbidden' ? 'La cuenta actual no tiene permiso para consultar inscripciones de Titulado.'
              : 'No pudimos consultar el servidor. Inténtalo nuevamente. Tus inscripciones continúan guardadas.'}</p>
            {loadError === 'session' ? (
              <Link href="/login" className="hu2-search-button">Iniciar sesión</Link>
            ) : (
              <button type="button" className="hu2-search-button" onClick={() => void load()}>
                Reintentar
              </button>
            )}
          </section>
        ) : items.length === 0 ? (
          <section className="hu2-catalog-state hu9-empty" role="status">
            <span className="hu2-state-icon" aria-hidden="true">
              <Info size={52} />
            </span>
            <h2>Aún no estás inscrito en ningún evento</h2>
            <p>Explora el catálogo y reserva tu participación en los eventos disponibles.</p>
            <Link href="/portal/eventos" className="hu2-detail-link hu9-center-link">
              Explorar eventos
            </Link>
          </section>
        ) : (
          <>
            <div className="hu9-filter-bar">
              <div className="hu9-filter-chips" role="group" aria-label="Filtrar mis eventos">
                {FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`hu9-filter-chip ${filter === option.value ? 'is-active' : ''}`}
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="hu9-count">{countLabel(filter, visibleItems.length)}</p>
            </div>

            {visibleItems.length === 0 ? (
              <section className="hu2-catalog-state hu9-empty" role="status">
                <span className="hu2-state-icon" aria-hidden="true">
                  <Info size={52} />
                </span>
                <h2>
                  {filter === 'finished' ? 'No tienes eventos finalizados' : 'No tienes eventos cancelados'}
                </h2>
                <p>
                  {filter === 'finished'
                    ? 'Los eventos en los que participes aparecerán aquí cuando finalicen.'
                    : 'Aquí aparecerán los eventos o inscripciones que hayan sido cancelados.'}
                </p>
                <Link href="/portal/eventos" className="hu2-detail-link hu9-center-link">
                  Explorar eventos
                </Link>
              </section>
            ) : (
              <div className="hu9-list">
                {visibleItems.map((item) => {
                  const tone = toneOf(item.participationStatus);
                  const canOpenPass = item.hasPass && item.participationStatus === 'VIGENTE';

                  return (
                    <article key={item.id} className={`hu9-event-card is-${tone}`}>
                      <h2>{item.event.title}</h2>
                      <span className={`hu9-status-chip is-${tone}`}>
                        {STATUS_LABEL[item.participationStatus]}
                      </span>
                      <div className="hu9-event-meta">
                        <p className="hu9-event-schedule">
                          {formatEventCardSchedule(item.event.startDate, item.event.endDate)}
                        </p>
                        <p>
                          {item.event.location
                            ? `Ubicación: ${item.event.location}`
                            : 'Ubicación no especificada'}
                        </p>
                      </div>
                      <div className="hu9-event-actions">
                        <Link href={`/portal/eventos/${item.event.id}`} className="hu9-action">
                          Ver detalle
                        </Link>
                        {canOpenPass ? (
                          <Link href="/mis-pases" className="hu9-action">
                            Ver pase
                          </Link>
                        ) : null}
                      {item.participationStatus === 'VIGENTE' ||
                      item.participationStatus === 'INSCRIPCION_CANCELADA' ? (
                        <CancelRegistrationAction
                          variant="card"
                          event={item.event}
                          status={item.status}
                          onConfirm={() => cancelEventRegistration(item.id)}
                          onCancelled={() => markCancelled(item.id)}
                          onConflict={refreshAfterConflict}
                        />
                      ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}