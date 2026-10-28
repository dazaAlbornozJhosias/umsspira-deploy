'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  EventParticipantsDto,
  EventParticipantPassStatus,
} from '@umsspira/shared-types';
import { useAuthenticatedUserId } from '@/modules/auth/frontend/components/authenticated-user-context';
import { getEventParticipants } from '@/shared/services/events-service';
import { formatEventDateTime } from '@/shared/utils/event-date-time';

const PASS_LABELS: Record<EventParticipantPassStatus, string> = {
  VIGENTE: 'Generado',
  INVALIDADO: 'Inválido',
  SIN_PASE: 'Sin pase',
};

export default function EventParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthenticatedUserId();
  const [data, setData] = useState<EventParticipantsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage(null);
    setData(null);

    if (!userId) {
      setErrorMessage('No hay una sesión administrativa disponible.');
      setIsLoading(false);
      return () => { active = false; };
    }

    void getEventParticipants(id, userId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudieron consultar los participantes y la ocupación.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [id, userId, retryCount]);

  const occupation = data?.occupation;
  const isEmpty = data !== null && data.participants.length === 0;

  return (
    <main className="events-page hu8-page">
      <header className="hu8-heading">
        <div>
          <h1>Participantes del evento</h1>
          <p>
            {isLoading
              ? 'Cargando información actualizada de inscripciones y ocupación.'
              : data
                ? `${data.eventTitle} · Inscripciones confirmadas, canceladas y ocupación.`
                : 'Consulta de inscripciones y ocupación.'}
          </p>
        </div>
        <Link href="/events" className="event-button hu8-back">
          Volver a gestión
        </Link>
      </header>

      {!isLoading && !errorMessage && occupation ? (
        isEmpty ? (
          <section className="hu8-empty-summary" aria-label="Capacidad del evento">
            <div><span>Cupo máximo</span><strong>{occupation.maxCapacity}</strong></div>
            <div><span>Ocupados</span><strong>{occupation.confirmed}</strong></div>
            <div><span>Disponibles</span><strong>{occupation.available}</strong></div>
            <span className="hu8-outline-chip">
              {occupation.occupancyPercent}% ocupación
            </span>
          </section>
        ) : (
          <section className="hu8-summary" aria-label="Ocupación del evento">
            <div className="hu8-stat">
              <strong>{occupation.maxCapacity}</strong><span>Cupo máximo</span>
            </div>
            <div className="hu8-stat hu8-stat-confirmed">
              <strong>{occupation.confirmed}</strong><span>Confirmados</span>
            </div>
            <div className="hu8-stat hu8-stat-cancelled">
              <strong>{occupation.cancelled}</strong><span>Cancelados</span>
            </div>
            <div className="hu8-stat">
              <strong>{occupation.available}</strong><span>Disponibles</span>
            </div>
            <div className="hu8-stat hu8-stat-percent">
              <strong>{occupation.occupancyPercent}%</strong><span>Ocupación</span>
            </div>
          </section>
        )
      ) : null}

      {isLoading ? (
        <section className="hu8-panel" aria-busy="true" aria-label="Cargando participantes">
          <header className="hu8-panel-heading">
            <h2>Participantes inscritos</h2>
            <span className="hu8-outline-chip" role="status">Actualizando</span>
          </header>
          <div className="hu8-skeleton" aria-hidden="true">
            {Array.from({ length: 5 }, (_, row) => (
              <div className="hu8-skeleton-row" key={row}>
                {Array.from({ length: 4 }, (_, column) => (
                  <span key={column} />
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : errorMessage ? (
        <section className="hu8-panel hu8-message">
          <h2>No se pudo cargar la información</h2>
          <p role="alert">{errorMessage}</p>
          <button
            type="button"
            className="event-button event-button-primary"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Reintentar
          </button>
        </section>
      ) : isEmpty ? (
        <section className="hu8-panel hu8-message hu8-empty" role="status">
          <span className="hu8-info" aria-hidden="true">ⓘ</span>
          <h2>Aún no hay participantes inscritos</h2>
          <p>
            Cuando los titulados se inscriban, aparecerán aquí con su fecha,
            estado y pase QR.
          </p>
        </section>
      ) : data ? (
        <section className="hu8-panel">
          <header className="hu8-panel-heading">
            <div>
              <h2>Participantes inscritos</h2>
              <p>Actualizado con el estado real de las inscripciones.</p>
            </div>
          </header>
          <div className="hu8-table-scroll">
            <table className="hu8-table">
              <caption className="hu8-sr-only">
                Participantes de {data.eventTitle}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Titulado</th>
                  <th scope="col">Fecha de inscripción</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Pase QR</th>
                </tr>
              </thead>
              <tbody>
                {data.participants.map((participant) => (
                  <tr key={participant.registrationId}>
                    <td>{participant.name}</td>
                    <td>{formatEventDateTime(participant.registeredAt)}</td>
                    <td>
                      <span className={`hu8-status ${
                        participant.status === 'CANCELADA' ? 'is-cancelled' : ''
                      }`}>
                        {participant.status}
                      </span>
                    </td>
                    <td className={
                      participant.passStatus === 'INVALIDADO'
                        ? 'hu8-invalid-pass'
                        : undefined
                    }>
                      {PASS_LABELS[participant.passStatus]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
