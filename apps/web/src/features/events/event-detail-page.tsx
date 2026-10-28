'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EVENT_STATUS, type EventItem, type EventRegistrationItem } from '@umsspira/shared-types';

import { ApiClientError } from '@/shared/services/api-client';
import { getPublishedEvent, registerForEvent } from '@/shared/services/events-service';
import { getCurrentUser } from '@/modules/auth/frontend/services/auth.service';
import { formatPeopleCount } from '@/shared/utils/event-copy';
import { formatEventDateTime } from '@/shared/utils/event-date-time';

interface EventDetailPageProps {
  params: { id: string };
  catalogHref?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function EventDetailPage({
  params,
  catalogHref = '/events/catalog',
}: EventDetailPageProps) {
  const { id } = params;
  const isValidId = UUID_PATTERN.test(id);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(isValidId);
  const [errorState, setErrorState] = useState<'invalid' | 'not-found' | 'unavailable' | null>(
    isValidId ? null : 'invalid',
  );
  const [isTitulado, setIsTitulado] = useState(false);
  const [registration, setRegistration] = useState<EventRegistrationItem | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationErrorKind, setRegistrationErrorKind] = useState<'duplicate' | 'capacity' | 'unavailable' | 'generic' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!isValidId) return;

    setIsLoading(true);
    setErrorState(null);

    try {
      setEvent(await getPublishedEvent(id));
      try {
        const currentUser = await getCurrentUser();
        setIsTitulado(currentUser.role === 'titulado');
      } catch {
        setIsTitulado(false);
      }
    } catch (error) {
      setEvent(null);
      setErrorState(
        error instanceof ApiClientError && error.status === 404
          ? 'not-found'
          : 'unavailable',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, isValidId]);

  const currentCapacity = event?.currentCapacity ?? 0;
  const availableCapacity = event ? Math.max(event.maxCapacity - currentCapacity, 0) : 0;
  const isFull = Boolean(event && event.currentCapacity !== undefined && currentCapacity >= event.maxCapacity);
  const isAvailable = Boolean(
    event && event.status === EVENT_STATUS.PUBLICADO &&
    new Date(event.endDate).getTime() > Date.now() && availableCapacity > 0,
  );

  async function confirmRegistration() {
    if (!event || isRegistering) return;
    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationErrorKind(null);
    try {
      const result = await registerForEvent(event.id);
      setRegistration(result);
      setEvent((current) => current ? { ...current, currentCapacity: result.currentCapacity } : current);
      setIsConfirmOpen(false);
    } catch (error) {
      setIsConfirmOpen(false);
      if (error instanceof ApiClientError && error.code === 'EVENT_REGISTRATION_ALREADY_CONFIRMED') {
        setRegistrationError('Ya tienes una inscripción confirmada para este evento.');
        setRegistrationErrorKind('duplicate');
      } else if (error instanceof ApiClientError && error.code === 'EVENT_CAPACITY_REACHED') {
        setRegistrationError('El evento alcanzó su cupo máximo. No se creó ninguna inscripción.');
        setRegistrationErrorKind('capacity');
        await loadEvent();
      } else if (error instanceof ApiClientError && error.code === 'EVENT_NOT_AVAILABLE') {
        setRegistrationError('Este evento ya no acepta nuevas inscripciones.');
        setRegistrationErrorKind('unavailable');
      } else {
        setRegistrationError('No pudimos completar tu inscripción. No se realizaron cambios.');
        setRegistrationErrorKind('generic');
      }
    } finally {
      setIsRegistering(false);
    }
  }

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  if (isLoading) {
    return (
      <main className="hu2-detail-page">
        <p className="hu2-detail-loading" role="status">
          Cargando evento...
        </p>
      </main>
    );
  }

  if (errorState || !event) {
    const message = errorState === 'invalid'
      ? 'El identificador del evento no es válido.'
      : errorState === 'not-found'
        ? 'El evento no fue encontrado o ya no está disponible.'
        : 'No se pudo cargar el evento en este momento.';

    return (
      <main className="hu2-detail-page">
        <section className="hu2-detail-unavailable">
          <h1>Evento no disponible</h1>
          <p role="alert">{message}</p>
          <div>
            <Link
              href={catalogHref}
              className="hu2-primary-action"
            >
              Regresar al catálogo
            </Link>
            {errorState === 'unavailable' ? (
              <button
                type="button"
                onClick={() => void loadEvent()}
                className="hu2-secondary-action"
              >
                Reintentar
              </button>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  if (registration) {
    return (
      <main className="hu2-detail-page hu3-success-page">
        <div className="hu2-detail-shell">
          <header className="hu3-success-heading">
            <h1>Inscripción confirmada</h1>
            <p>Tu lugar está reservado. El sistema ya generó tu pase digital.</p>
          </header>
          <section className="hu3-success-card" role="status">
            <span className="hu3-success-icon" aria-hidden="true">✓</span>
            <h2>¡Ya eres parte del evento!</h2>
            <span className="hu3-status-chip">CONFIRMADA</span>
            <div className="hu3-success-summary">
              <strong>{event.title}</strong>
              <span>{formatEventDateTime(event.startDate)} · {event.location || 'Ubicación por definir'}</span>
              <small>Tu pase QR está disponible</small>
            </div>
            <div className="hu3-external-actions" aria-label="Acciones de la inscripción">
              <button type="button" className="hu3-result-action" disabled title="Disponible al integrar HU9">
                Ver mis eventos
              </button>
              <button type="button" className="hu3-result-action hu3-result-action-primary" disabled title="Disponible al integrar HU10">
                Ver pase QR
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="hu2-detail-page">
      <div className="hu2-detail-shell">
        <Link
          href={catalogHref}
          className="hu2-back-link"
        >
          ← Volver al catálogo
        </Link>

        <div className="hu2-detail-grid">
          <article className="hu2-detail-hero">
            <header
              className={`hu2-detail-cover ${event.imageUrl ? 'has-image' : ''}`}
              style={event.imageUrl ? {
                backgroundImage: `linear-gradient(90deg, rgba(22, 32, 44, .46), rgba(22, 32, 44, .1)), url("${event.imageUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              <span className="hu2-cover-accent" aria-hidden="true" />
              <span className="hu2-cover-circle hu2-cover-circle-large" aria-hidden="true" />
              <span className="hu2-cover-circle hu2-cover-circle-small" aria-hidden="true" />
              <p>Evento universitario</p>
              <strong>{event.title.toLocaleUpperCase('es')}</strong>
              <span className="hu2-detail-status">{event.status}</span>
            </header>
            <div className="hu2-detail-hero-copy">
              <h1 className="min-w-0 max-w-full break-words">
                {event.title}
              </h1>
            </div>
          </article>

          <aside className="hu2-detail-info">
            <h2>Información del evento</h2>
            <dl>
              <div><dt>Inicio</dt><dd>{formatEventDateTime(event.startDate)}</dd></div>
              <div><dt>Fin</dt><dd>{formatEventDateTime(event.endDate)}</dd></div>
              <div><dt>Ubicación</dt><dd>{event.location || 'Por definir'}</dd></div>
              <div><dt>Cupo máximo</dt><dd>{formatPeopleCount(event.maxCapacity)}</dd></div>
              <div><dt>Organiza</dt><dd>UMSSPIRA</dd></div>
            </dl>
            {event.currentCapacity !== undefined ? (
              <div className="hu3-capacity-section">
                <span>Cupos disponibles</span>
                <div>
                  <strong>{availableCapacity} de {event.maxCapacity}</strong>
                  <small>
                    {currentCapacity} {currentCapacity === 1 ? 'inscripción confirmada' : 'inscripciones confirmadas'}
                  </small>
                </div>
              </div>
            ) : null}
            {registrationErrorKind === 'capacity' && registrationError ? <p className="hu3-registration-message" role="alert">{registrationError}</p> : null}
            {isTitulado && isAvailable ? (
              <button type="button" className="hu3-register-button" onClick={() => setIsConfirmOpen(true)}>
                Inscribirme
              </button>
            ) : isTitulado && isFull ? (
              <button type="button" className="hu3-register-button" disabled>
                Sin cupos disponibles
              </button>
            ) : isTitulado ? (
              <p className="hu3-registration-message">Este evento ya no acepta nuevas inscripciones.</p>
            ) : null}
          </aside>
        </div>

        <section className="hu2-detail-description">
          <h2>Descripción</h2>
          <p>{event.description || 'Sin descripción disponible.'}</p>
        </section>
        {isFull ? (
          <section className="hu3-capacity-alert" role="alert">
            <div>
              <h2>No es posible completar la inscripción</h2>
              <p>El evento alcanzó su cupo máximo. No se creará ningún registro de inscripción.</p>
            </div>
            <Link href={catalogHref} className="hu3-capacity-alert-link">
              Volver al catálogo
            </Link>
          </section>
        ) : null}
      </div>
      {isConfirmOpen && event ? (
        <div className="hu3-modal-backdrop" role="presentation">
          <section className="hu3-registration-modal" role="dialog" aria-modal="true" aria-labelledby="hu3-confirm-title">
            <div className="hu3-modal-icon" aria-hidden="true" />
            <h2 id="hu3-confirm-title">Confirmar inscripción</h2>
            <p>Reservaremos un cupo a tu nombre para este evento.</p>
            <div className="hu3-modal-summary">
              <strong>{event.title}</strong>
              <span>{formatEventDateTime(event.startDate)}</span>
              <span>{event.location || 'Ubicación por definir'} · {availableCapacity} cupos disponibles</span>
            </div>
            <div className="hu3-modal-actions">
              <button type="button" className="hu3-modal-secondary" onClick={() => setIsConfirmOpen(false)} disabled={isRegistering}>Volver</button>
              <button type="button" className="hu3-modal-primary" onClick={() => void confirmRegistration()} disabled={isRegistering}>
                {isRegistering ? 'Confirmando...' : 'Confirmar inscripción'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {registrationErrorKind === 'duplicate' ? (
        <div className="hu3-modal-backdrop">
          <section className="hu3-registration-modal hu3-result-modal" role="alertdialog" aria-modal="true" aria-labelledby="hu3-duplicate-title">
            <div className="hu3-result-icon" aria-hidden="true">i</div>
            <h2 id="hu3-duplicate-title">Ya estás inscrito</h2>
            <p>No necesitas volver a reservar un cupo. Tu inscripción actual continúa confirmada.</p>
            <span className="hu3-status-chip">INSCRIPCIÓN CONFIRMADA</span>
            <div className="hu3-external-actions" aria-label="Acciones de la inscripción">
              <button type="button" className="hu3-result-action" disabled title="Disponible al integrar HU9">
                Ver mis eventos
              </button>
              <button type="button" className="hu3-result-action hu3-result-action-primary" disabled title="Disponible al integrar HU10">
                Ver pase QR
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {registrationErrorKind === 'generic' ? (
        <div className="hu3-modal-backdrop">
          <section className="hu3-registration-modal hu3-result-modal hu3-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="hu3-error-title">
            <div className="hu3-result-icon hu3-result-icon-error" aria-hidden="true">!</div>
            <h2 id="hu3-error-title">No pudimos completar tu inscripción</h2>
            <p>Ocurrió un problema al registrar tu cupo. No se realizaron cambios en tu inscripción ni en la disponibilidad del evento.</p>
            <div className="hu3-error-assurance">Tus datos están seguros. Puedes intentarlo nuevamente.</div>
            <div className="hu3-modal-actions">
              <button type="button" className="hu3-modal-secondary" onClick={() => {
                setRegistrationError(null);
                setRegistrationErrorKind(null);
              }}>Volver al detalle</button>
              <button type="button" className="hu3-modal-primary" onClick={() => void confirmRegistration()} disabled={isRegistering}>
                {isRegistering ? 'Reintentando...' : 'Reintentar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {registrationErrorKind === 'unavailable' ? (
        <div className="hu3-modal-backdrop">
          <section className="hu3-registration-modal hu3-result-modal hu3-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="hu3-unavailable-title">
            <div className="hu3-result-icon hu3-result-icon-error" aria-hidden="true">!</div>
            <h2 id="hu3-unavailable-title">Evento no disponible</h2>
            <p>{registrationError}</p>
            <div className="hu3-result-actions">
              <Link href={catalogHref} className="hu3-result-action hu3-result-action-primary">Volver al catálogo</Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
