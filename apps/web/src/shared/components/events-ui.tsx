'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  EVENT_STATUS,
  type EventItem,
  type EventStatus,
  type InactiveEventItem,
  type InactiveEventStatus,
} from '@umsspira/shared-types';
import {
  Archive,
  Check,
  Eye,
  MoreVertical,
  Plus,
} from 'lucide-react';
import {
  getAdminEvents,
  getInactiveEvents,
  cancelPublishedEvent,
  publishDraftEvent,
  retireEvent,
} from '@/shared/services/events-service';
import {
  useAuthenticatedUserId,
} from '@/modules/auth/frontend/components/authenticated-user-context';
import {
  formatEventDate,
  formatEventDateTime,
  formatEventMonth,
  formatEventSchedule,
  getEventMonthKey,
} from '@/shared/utils/event-date-time';

type AdminSection = 'management' | 'create' | 'drafts' | 'inactive';

export function EventsHeader({ children }: { children: React.ReactNode }) {
  return <div className="events-app">{children}</div>;
}
export function EventAdminTabs({ active }: { active: AdminSection }) {
  const tabs: Array<{ key: AdminSection; label: string; href: string }> = [
    { key: 'management', label: 'Gestión', href: '/events' },
    { key: 'create', label: 'Crear evento', href: '/events/create' },
    { key: 'drafts', label: 'Borradores', href: '/events/drafts' },
    { key: 'inactive', label: 'Inactivos', href: '/events/inactive' },
  ];

  return (
    <nav className="event-admin-tabs" aria-label="Administración de eventos">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? 'page' : undefined}
          className={active === tab.key ? 'is-active' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

const MISSING_EVENTS_IDENTITY =
  'No hay un usuario autenticado disponible para consultar los eventos.';

export function EventManagementContent({
  compact = false,
  userId: providedUserId,
}: {
  compact?: boolean;
  userId?: string;
}) {
  const authenticatedUserId = useAuthenticatedUserId();
  const userId = providedUserId ?? authenticatedUserId;
  const router = useRouter();
  const {
    events,
    setEvents,
    isLoading,
    errorMessage,
    setErrorMessage,
  } = useAdminEvents(userId, !compact);
  const [pendingPublication, setPendingPublication] = useState<EventItem | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pendingCancellation, setPendingCancellation] = useState<EventItem | null>(null);
  const [cancelledResult, setCancelledResult] = useState<{
    event: EventItem;
    registrationsCount: number;
    invalidatedPassesCount: number;
  } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [openActionEventId, setOpenActionEventId] = useState<string | null>(null);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLocaleLowerCase('es');
    return events.filter((event) => {
      const matchesSearch = event.title
        .toLocaleLowerCase('es')
        .includes(normalizedSearch);
      const matchesMonth = monthFilter === 'all'
        || getEventMonthKey(event.startDate) === monthFilter;
      const matchesStatus = statusFilter === 'all'
        || event.status === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [events, monthFilter, searchFilter, statusFilter]);
  const availableMonths = useMemo(
    () => Array.from(
      new Set(events.map((event) => getEventMonthKey(event.startDate))),
    ).sort(),
    [events],
  );
  const { publishedCount, draftCount } = useMemo(
    () => events.reduce(
      (counts, event) => ({
        publishedCount: counts.publishedCount
          + Number(event.status === EVENT_STATUS.PUBLICADO),
        draftCount: counts.draftCount
          + Number(event.status === EVENT_STATUS.BORRADOR),
      }),
      { publishedCount: 0, draftCount: 0 },
    ),
    [events],
  );

  const confirmPublication = async () => {
    if (!pendingPublication || !userId) return;

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const publishedEvent = await publishDraftEvent(
        pendingPublication.id,
        userId,
      );
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === publishedEvent.id ? publishedEvent : event,
        ),
      );
      setPendingPublication(null);
      setPublishedEventId(publishedEvent.id);
    } catch (error) {
      setPendingPublication(null);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const cancelEvent = async () => {
    if (!userId || !pendingCancellation) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelPublishedEvent(pendingCancellation.id, userId);
      setEvents((current) => current.map((item) => item.id === result.event.id ? result.event : item));
      setPendingCancellation(null);
      setCancelledResult(result);
    } catch (error) {
      setCancelError(getRequestErrorMessage(error));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className={`events-page events-management ${compact ? 'is-compact' : ''}`}>
      <div className="events-title-row">
        <div>
          <h1>Gestión de eventos</h1>
          <p>Administra los eventos universitarios de la comunidad UMSSPIRA.</p>
        </div>
        <div className="events-title-actions">
          <Link href="/events/inactive" className="event-button event-button-secondary events-inactive-button">
            Eventos inactivos
          </Link>
          <Link href="/events/create" className="event-button event-button-primary events-create-button">
            <Plus size={16} /> Crear evento
          </Link>
        </div>
      </div>

      <EventAdminTabs active="management" />

      <div className="event-metrics" aria-label="Resumen de eventos">
        <Metric value={events.length} label="Total de eventos" mobileLabel="Total" tone="orange" />
        <Metric value={publishedCount} label="Publicados" tone="blue" />
        <Metric value={draftCount} label="Borradores" tone="red" />
      </div>

      <section className="events-list-panel">
        <div className="events-filters">
          <input
            aria-label="Buscar"
            placeholder="Buscar eventos por título…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <select
            aria-label="Fecha"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            <option value="all">Todas las fechas</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatEventMonth(month)}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value={EVENT_STATUS.BORRADOR}>Borrador</option>
            <option value={EVENT_STATUS.PUBLICADO}>Publicado</option>
            <option value={EVENT_STATUS.CANCELADO}>Cancelado</option>
          </select>
          <button
            type="button"
            className="event-button event-button-primary"
            onClick={() => {
              setSearchFilter(searchInput);
              setMonthFilter(selectedMonth);
              setStatusFilter(selectedStatus);
            }}
          >
            Filtrar
          </button>
        </div>

        <h2>Listado de eventos</h2>

        {errorMessage ? <div className="event-feedback" role="alert">{errorMessage}</div> : null}
        {isLoading ? <p className="events-list-footer" role="status">Cargando eventos…</p> : null}

        <div className="events-table" role="table" aria-label="Listado de eventos">
          <div className="events-table-head" role="row">
            <span>Evento</span><span>Fecha y hora</span><span>Ubicación</span>
            <span>Cupo</span><span>Estado</span><span>Acciones</span>
          </div>
          {!isLoading && !errorMessage && filteredEvents.map((event) => (
            <article className="events-table-row" role="row" key={event.id}>
              <div className="event-list-title">
                <span className="event-thumb">
                  {getEventInitials(event.title)}
                </span>
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    Creado por {event.creatorName || 'Administrador'}
                    <br />
                    Creado el {formatEventDateTime(event.createdAt)}
                  </small>
                </span>
              </div>
              <span className="event-date"><strong>{formatEventSchedule(event.startDate, event.endDate)}</strong></span>
              <span className="event-location">{event.location ?? 'Sin ubicación'}</span>
              <span className="event-capacity">{event.maxCapacity}</span>
              <StatusChip status={event.status} />
              <div className={`event-row-actions ${event.status === EVENT_STATUS.PUBLICADO ? 'is-published' : 'is-draft'}`}>
                {event.status === EVENT_STATUS.PUBLICADO ? (
                  <>
                    <button
                      type="button"
                      className="event-button event-button-secondary event-action-view"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <Eye size={15} aria-hidden="true" /> Ver
                    </button>
                    <div className="event-actions-menu">
                      <button
                        type="button"
                        aria-label={`Acciones para ${event.title}`}
                        aria-expanded={openActionEventId === event.id}
                        onClick={() => setOpenActionEventId((current) => current === event.id ? null : event.id)}
                      >
                        <MoreVertical size={17} aria-hidden="true" />
                      </button>
                      {openActionEventId === event.id ? (
                        <div className="event-actions-popover">
                          <strong>{event.title}</strong>
                          <small>Acciones del evento</small>
                          <button type="button" onClick={() => router.push(`/events/${event.id}/edit`)}>Editar evento</button>
                          <Link href={`/events/${encodeURIComponent(event.id)}/participants`} className="event-actions-item">Ver participantes</Link>
                          <button type="button" className="is-danger" disabled={isCancelling} onClick={() => { setOpenActionEventId(null); setCancelError(null); setPendingCancellation(event); }}>Cancelar evento</button>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : event.status === EVENT_STATUS.BORRADOR ? (
                  <>
                    <button type="button" className="event-button event-button-secondary event-action-edit" onClick={() => router.push(`/events/drafts/${event.id}`)}>Editar</button>
                    <button type="button" className="event-button event-button-primary event-action-publish" onClick={() => setPendingPublication(event)} disabled={isPublishing}>Publicar</button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {!isLoading && !errorMessage && filteredEvents.length === 0 ? (
          <p className="events-list-footer" role="status">
            {events.length === 0
              ? 'No hay eventos registrados.'
              : 'No se encontraron eventos que coincidan con los filtros.'}
          </p>
        ) : null}
        {!isLoading && !errorMessage && filteredEvents.length > 0 ? (
          <p className="events-list-footer">
            Mostrando {filteredEvents.length} de {events.length} eventos
          </p>
        ) : null}
      </section>

      {pendingPublication ? (
        <EventConfirmDialog
          event={toEventSummary(pendingPublication)}
          isSubmitting={isPublishing}
          onCancel={() => setPendingPublication(null)}
          onConfirm={() => void confirmPublication()}
        />
      ) : null}

      {publishedEventId ? (
        <EventSuccessDialog
          eventId={publishedEventId}
          onBack={() => setPublishedEventId(null)}
        />
      ) : null}

      {pendingCancellation ? (
        <EventCancelDialog
          event={pendingCancellation}
          isSubmitting={isCancelling}
          errorMessage={cancelError}
          onCancel={() => { if (!isCancelling) setPendingCancellation(null); }}
          onConfirm={() => void cancelEvent()}
        />
      ) : null}
      {cancelledResult ? (
        <EventCancelledDialog
          result={cancelledResult}
        />
      ) : null}
    </main>
  );
}

export function EventDraftsContent({
  userId: providedUserId,
}: {
  userId?: string;
}) {
  const authenticatedUserId = useAuthenticatedUserId();
  const userId = providedUserId ?? authenticatedUserId;
  const router = useRouter();
  const {
    events,
    setEvents,
    isLoading,
    errorMessage,
    setErrorMessage,
  } = useAdminEvents(userId);
  const [pendingPublication, setPendingPublication] = useState<EventItem | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const drafts = events.filter(
    (event) => event.status === EVENT_STATUS.BORRADOR,
  );

  const confirmPublication = async () => {
    if (!pendingPublication || !userId) return;

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const publishedEvent = await publishDraftEvent(
        pendingPublication.id,
        userId,
      );
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === publishedEvent.id ? publishedEvent : event,
        ),
      );
      setPendingPublication(null);
      setPublishedEventId(publishedEvent.id);
    } catch (error) {
      setPendingPublication(null);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="events-page event-drafts-page">
      <div className="events-title-row">
        <div>
          <h1>Borradores</h1>
          <p>
            <span className="draft-desktop-title">Eventos guardados que todavía no son visibles para la comunidad.</span>
            <span className="draft-mobile-title">Eventos guardados para continuar editando después.</span>
          </p>
        </div>
        <Link href="/events/create" className="event-button event-button-primary events-create-button">
          <Plus size={16} /> Crear evento
        </Link>
      </div>

      <EventAdminTabs active="drafts" />

      <section className="event-drafts-panel">
        <input className="draft-search" aria-label="Buscar borradores" placeholder="Buscar borradores…" readOnly />
        <h2>{drafts.length} {drafts.length === 1 ? 'borrador' : 'borradores'}</h2>
        {errorMessage ? <div className="event-feedback" role="alert">{errorMessage}</div> : null}
        {isLoading ? <p className="events-list-footer" role="status">Cargando borradores…</p> : null}
        {!isLoading && !errorMessage && drafts.length === 0 ? (
          <p className="events-list-footer" role="status">No hay borradores guardados.</p>
        ) : null}
        <div className="draft-list">
          {!isLoading && !errorMessage && drafts.map((draft) => (
            <article className="draft-row" key={draft.id}>
              <div className="draft-main">
                <span className="event-thumb">{getEventInitials(draft.title)}</span>
                <span>
                  <strong>{draft.title}</strong>
                  <small>Creado el {formatEventDate(draft.createdAt)}</small>
                </span>
              </div>
              <span className="draft-date">
                <span>{formatEventSchedule(draft.startDate, draft.endDate)}</span>
                <span>{draft.location ?? 'Sin ubicación'}</span>
              </span>
              <StatusChip status={draft.status} />
              <div className="draft-actions">
                <Link href={`/events/drafts/${draft.id}`} className="event-button event-button-secondary">Continuar edición</Link>
                <button type="button" className="event-button event-button-primary" onClick={() => setPendingPublication(draft)} disabled={isPublishing}>Publicar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {pendingPublication ? (
        <EventConfirmDialog
          event={toEventSummary(pendingPublication)}
          isSubmitting={isPublishing}
          onCancel={() => setPendingPublication(null)}
          onConfirm={() => void confirmPublication()}
        />
      ) : null}

      {publishedEventId ? (
        <EventSuccessDialog
          eventId={publishedEventId}
          onBack={() => router.push('/events')}
        />
      ) : null}
    </main>
  );
}

export function EventInactiveContent({
  userId: providedUserId,
}: {
  userId?: string;
}) {
  const authenticatedUserId = useAuthenticatedUserId();
  const userId = providedUserId ?? authenticatedUserId;
  const {
    events,
    setEvents,
    isLoading,
    errorMessage,
    setErrorMessage,
  } = useInactiveEvents(userId);
  const [pendingRetire, setPendingRetire] = useState<InactiveEventItem | null>(null);
  const [isRetiring, setIsRetiring] = useState(false);
  const [retiredEvent, setRetiredEvent] = useState<InactiveEventItem | null>(null);

  const confirmRetire = async () => {
    if (!pendingRetire || !userId) return;

    setIsRetiring(true);
    setErrorMessage(null);

    try {
      await retireEvent(pendingRetire.id, userId);
      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== pendingRetire.id),
      );
      setRetiredEvent(pendingRetire);
      setPendingRetire(null);
    } catch (error) {
      setPendingRetire(null);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsRetiring(false);
    }
  };

  return (
    <main className="events-page event-inactive-page">
      <div className="events-title-row">
        <div>
          <h1>Eventos inactivos</h1>
          <p>
            Eventos cancelados o finalizados que siguen en tu gestión. Puedes
            retirarlos para quitarlos de la administración activa.
          </p>
        </div>
      </div>

      <EventAdminTabs active="inactive" />

      <section className="event-inactive-panel">
        <h2>
          {events.length} {events.length === 1 ? 'evento inactivo' : 'eventos inactivos'}
        </h2>
        {errorMessage ? <div className="event-feedback" role="alert">{errorMessage}</div> : null}
        {isLoading ? <p className="events-list-footer" role="status">Cargando eventos inactivos…</p> : null}
        {!isLoading && !errorMessage && events.length === 0 ? (
          <p className="events-list-footer" role="status">
            No hay eventos cancelados o finalizados por retirar.
          </p>
        ) : null}
        <div className="event-inactive-list">
          {!isLoading && !errorMessage && events.map((event) => (
            <article className="event-inactive-row" key={event.id}>
              <div className="event-inactive-main">
                <span className={`event-thumb ${event.inactiveStatus === 'CANCELADO' ? 'is-red' : ''}`}>
                  {getEventInitials(event.title)}
                </span>
                <span>
                  <strong>{event.title}</strong>
                  <small>{formatEventSchedule(event.startDate, event.endDate)}</small>
                  <small>{event.location ?? 'Sin ubicación'}</small>
                </span>
              </div>
              <span className="event-inactive-relations">
                {event.registrationsCount} {event.registrationsCount === 1 ? 'inscripción' : 'inscripciones'}
                {' · '}
                {event.passesCount} {event.passesCount === 1 ? 'pase' : 'pases'}
              </span>
              <InactiveStatusChip status={event.inactiveStatus} />
              <div className="event-inactive-actions">
                <button
                  type="button"
                  className="event-button event-button-secondary event-action-retire"
                  onClick={() => setPendingRetire(event)}
                  disabled={isRetiring}
                >
                  <Archive size={15} aria-hidden="true" /> Retirar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {pendingRetire ? (
        <EventRetireDialog
          event={pendingRetire}
          isSubmitting={isRetiring}
          onCancel={() => setPendingRetire(null)}
          onConfirm={() => void confirmRetire()}
        />
      ) : null}

      {retiredEvent ? (
        <EventRetiredDialog
          event={retiredEvent}
          onBack={() => setRetiredEvent(null)}
        />
      ) : null}
    </main>
  );
}

function InactiveStatusChip({ status }: { status: InactiveEventStatus }) {
  const label = status === 'CANCELADO' ? 'Cancelado' : 'Finalizado';
  const statusClass = status === 'CANCELADO' ? 'is-cancelled' : 'is-finished';

  return <span className={`event-status ${statusClass}`}>{label}</span>;
}

function useInactiveEvents(userId: string | undefined) {
  const [events, setEvents] = useState<InactiveEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!userId) {
      setEvents([]);
      setErrorMessage(MISSING_EVENTS_IDENTITY);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);

    void getInactiveEvents(userId)
      .then((inactiveEvents) => {
        if (isActive) setEvents(inactiveEvents);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setEvents([]);
          setErrorMessage(getRequestErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  return {
    events,
    setEvents,
    isLoading,
    errorMessage,
    setErrorMessage,
  };
}

function Metric({ value, label, mobileLabel, tone }: { value: number; label: string; mobileLabel?: string; tone: string }) {  return (
    <article className={`event-metric is-${tone}`}>
      <span className="metric-accent" />
      <strong>{value}</strong>
      <span className="metric-label-desktop">{label}</span>
      <span className="metric-label-mobile">{mobileLabel ?? label}</span>
    </article>
  );
}

export function StatusChip({ status }: { status: EventStatus }) {
  const label = status === EVENT_STATUS.PUBLICADO
    ? 'Publicado'
    : status === EVENT_STATUS.BORRADOR
      ? 'Borrador'
      : 'Cancelado';
  const statusClass = status === EVENT_STATUS.PUBLICADO
    ? 'is-published'
    : status === EVENT_STATUS.BORRADOR
      ? 'is-draft'
      : 'is-cancelled';

  return <span className={`event-status ${statusClass}`}>{label}</span>;
}

function useAdminEvents(
  userId: string | undefined,
  enabled = true,
) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setEvents([]);
      setErrorMessage(null);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    if (!userId) {
      setEvents([]);
      setErrorMessage(MISSING_EVENTS_IDENTITY);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);

    void getAdminEvents(userId)
      .then((adminEvents) => {
        if (isActive) setEvents(adminEvents);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setEvents([]);
          setErrorMessage(getRequestErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [enabled, userId]);

  return {
    events,
    setEvents,
    isLoading,
    errorMessage,
    setErrorMessage,
  };
}

function getEventInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'EV';
}

function toEventSummary(event: EventItem): EventSummary {
  return {
    title: event.title,
    dateLabel: formatEventSchedule(event.startDate, event.endDate),
    location: event.location ?? '',
    maxCapacity: event.maxCapacity,
  };
}

function getRequestErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'No se pudo completar la operación. Inténtalo nuevamente.';
}

export interface EventSummary {
  title: string;
  dateLabel: string;
  location: string;
  maxCapacity: number;
}

export function EventConfirmDialog({
  event,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  event: EventSummary;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-event-title">
        <h2 id="confirm-event-title">¿Publicar este evento?</h2>
        <p>Una vez publicado será visible en el catálogo de la comunidad.</p>
        <div className="event-confirm-summary">
          <div className="event-confirm-cover"><span>FERIA TI</span><i /></div>
          <div>
            <strong>{event.title}</strong>
            <span>{event.dateLabel}</span>
            <span>Ubicación: {event.location || 'Por definir'}</span>
            <span>Cupo máximo: {event.maxCapacity}</span>
          </div>
        </div>
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className="event-button event-button-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Publicando…' : 'Publicar evento'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function EventCancelDialog({
  event,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  event: EventItem;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const registrationsCount = event.currentCapacity ?? 0;
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-event-title">
        <h2 id="cancel-event-title">Cancelar evento publicado</h2>
        <p>La acción impedirá nuevas inscripciones y afectará las inscripciones y pases asociados.</p>
        <div className="event-cancel-summary">
          <strong>{event.title} · {registrationsCount} {registrationsCount === 1 ? 'inscripción' : 'inscripciones'}</strong>
          <ul>
            <li>El evento pasará a estado CANCELADO.</li>
            <li>Las inscripciones dejarán de ser participaciones vigentes.</li>
            <li>Los pases QR vigentes quedarán invalidados.</li>
            <li>Se conservará el registro para trazabilidad.</li>
          </ul>
        </div>
        {errorMessage ? <p className="event-cancel-error" role="alert">{errorMessage}</p> : null}
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isSubmitting}>No cancelar</button>
          <button type="button" className="event-button event-button-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Cancelando…' : 'Confirmar cancelación'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function EventCancelledDialog({
  result,
}: {
  result: { event: EventItem; registrationsCount: number; invalidatedPassesCount: number };
}) {
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-success-dialog" role="dialog" aria-modal="true" aria-labelledby="event-cancelled-title">
        <span className="event-success-icon"><Check size={40} strokeWidth={3} /></span>
        <h2 id="event-cancelled-title">Evento cancelado</h2>
        <p>{result.event.title} fue retirado del catálogo activo y se conservará su trazabilidad.</p>
        <div className="event-cancel-result-counts">
          <span>{result.registrationsCount} {result.registrationsCount === 1 ? 'inscripción afectada' : 'inscripciones afectadas'}</span>
          <span>{result.invalidatedPassesCount} {result.invalidatedPassesCount === 1 ? 'pase invalidado' : 'pases invalidados'}</span>
        </div>
        <div className="event-dialog-actions">
          <Link href="/events/inactive" className="event-button event-button-primary">Retirar del activo</Link>
        </div>
      </section>
    </div>
  );
}

export function EventSuccessDialog({
  eventId,
  onBack,
}: {
  eventId: string;
  onBack: () => void;
}) {
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-success-dialog" role="dialog" aria-modal="true" aria-labelledby="event-success-title">
        <span className="event-success-icon"><Check size={40} strokeWidth={3} /></span>
        <h2 id="event-success-title">¡Evento publicado correctamente!</h2>
        <p>El evento ya está disponible en el catálogo.</p>
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary event-back-button" onClick={onBack}>Volver a eventos</button>
          <Link
            href={`/events/${encodeURIComponent(eventId)}`}
            className="event-button event-button-primary event-view-button"
          >
            Ver evento
          </Link>
        </div>
      </section>
    </div>
  );
}

export function EventRetireDialog({
  event,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  event: InactiveEventItem;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hasHistory = event.registrationsCount > 0 || event.passesCount > 0;

  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="retire-event-title">
        <h2 id="retire-event-title">¿Retirar este evento?</h2>
        <p>
          El evento dejará de aparecer en tu gestión activa. Esta acción no se
          puede deshacer.
        </p>
        <div className="event-confirm-summary">
          <div className="event-confirm-cover"><span>{getEventInitials(event.title)}</span><i /></div>
          <div>
            <strong>{event.title}</strong>
            <span>{formatEventSchedule(event.startDate, event.endDate)}</span>
            <span>Ubicación: {event.location || 'Por definir'}</span>
            <span>
              {event.registrationsCount} {event.registrationsCount === 1 ? 'inscripción' : 'inscripciones'}
              {' · '}
              {event.passesCount} {event.passesCount === 1 ? 'pase' : 'pases'}
            </span>
          </div>
        </div>
        <p className="event-retire-note">
          {hasHistory
            ? 'El evento conserva inscripciones o pases, por lo que se archivará para preservar el historial.'
            : 'El evento no tiene inscripciones ni pases, por lo que se eliminará permanentemente.'}
        </p>
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className="event-button event-button-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Retirando…' : 'Retirar evento'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function EventRetiredDialog({
  event,
  onBack,
}: {
  event: InactiveEventItem;
  onBack: () => void;
}) {
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-success-dialog" role="dialog" aria-modal="true" aria-labelledby="event-retired-title">
        <span className="event-success-icon"><Check size={40} strokeWidth={3} /></span>
        <h2 id="event-retired-title">¡Evento retirado correctamente!</h2>
        <p>
          {event.title} ya no forma parte de tu gestión activa.
        </p>
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary event-back-button" onClick={onBack}>Volver a inactivos</button>
        </div>
      </section>
    </div>
  );
}
