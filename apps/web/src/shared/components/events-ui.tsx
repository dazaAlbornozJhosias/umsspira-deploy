'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  EVENT_STATUS,
  type EventItem,
  type EventStatus,
} from '@umsspira/shared-types';
import {
  Bell,
  Check,
  ChevronDown,
  Menu,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
} from 'lucide-react';
import {
  getAdminEvents,
  publishDraftEvent,
} from '@/shared/services/events-service';

type AdminSection = 'management' | 'create' | 'drafts';

export function EventsHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const eventsMenuRef = useRef<HTMLDivElement>(null);
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState(false);
  const eventMenuItems = [
    { href: '/events', label: 'Gestión de eventos' },
    { href: '/events/create', label: 'Crear evento' },
    { href: '/events/drafts', label: 'Borradores' },
  ];
  const activeEventHref = pathname.startsWith('/events/create')
    ? '/events/create'
    : pathname.startsWith('/events/drafts')
      ? '/events/drafts'
      : '/events';

  useEffect(() => {
    setIsEventsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isEventsMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        eventsMenuRef.current &&
        !eventsMenuRef.current.contains(event.target as Node)
      ) {
        setIsEventsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEventsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEventsMenuOpen]);

  return (
    <div className="events-app">
      <header className="events-desktop-header">
        <Link href="/events" className="events-logo-link" aria-label="UMSSPIRA - Eventos">
          <Image
            src="/assets/events/umsspira-logo-desktop.png"
            alt="UMSSPIRA"
            width={170}
            height={56}
            priority
          />
        </Link>

        <nav className="events-main-nav" aria-label="Navegación principal">
          <span>Inicio</span>
          <span>Comunidad</span>
          <span>Directorio</span>
          <span>Bolsa de trabajo</span>
          <span>Mentorías</span>
          <div className="events-nav-dropdown" ref={eventsMenuRef}>
            <button
              type="button"
              className="events-nav-trigger is-active"
              aria-expanded={isEventsMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsEventsMenuOpen((isOpen) => !isOpen)}
            >
              Eventos <ChevronDown size={13} strokeWidth={2.3} />
            </button>
            {isEventsMenuOpen ? (
              <div className="events-dropdown-menu" role="menu">
                {eventMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    aria-current={activeEventHref === item.href ? 'page' : undefined}
                    className={activeEventHref === item.href ? 'is-active' : undefined}
                    onClick={() => {
                      if (activeEventHref === item.href) setIsEventsMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="events-header-actions" aria-label="Acciones de cuenta">
          <Search size={22} />
          <MessageSquare size={22} />
          <span className="events-notification-icon">
            <Bell size={22} />
          </span>
          <span className="events-profile-separator" />
          <span className="events-avatar">AD</span>
          <span className="events-profile-copy">
            <strong>Administración</strong>
            <small>Sin sesión</small>
          </span>
          <ChevronDown size={15} />
        </div>
      </header>

      <header className="events-mobile-header">
        <Menu size={24} aria-hidden="true" />
        <Link href="/events" aria-label="UMSSPIRA - Eventos">
          <Image
            src="/assets/events/umsspira-logo-2.png"
            alt="UMSSPIRA"
            width={107}
            height={30}
            priority
          />
        </Link>
        <span className="events-mobile-avatar" aria-label="Administración">AD</span>
      </header>

      {children}
    </div>
  );
}

export function EventAdminTabs({ active }: { active: AdminSection }) {
  const tabs: Array<{ key: AdminSection; label: string; href: string }> = [
    { key: 'management', label: 'Gestión', href: '/events' },
    { key: 'create', label: 'Crear evento', href: '/events/create' },
    { key: 'drafts', label: 'Borradores', href: '/events/drafts' },
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
  userId,
}: {
  compact?: boolean;
  userId?: string;
}) {
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
  const [publicationSucceeded, setPublicationSucceeded] = useState(false);
  const publishedCount = events.filter(
    (event) => event.status === EVENT_STATUS.PUBLICADO,
  ).length;
  const draftCount = events.filter(
    (event) => event.status === EVENT_STATUS.BORRADOR,
  ).length;

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
      setPublicationSucceeded(true);
    } catch (error) {
      setPendingPublication(null);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className={`events-page events-management ${compact ? 'is-compact' : ''}`}>
      <div className="events-title-row">
        <div>
          <h1>Gestión de eventos</h1>
          <p>Administra los eventos universitarios de la comunidad UMSSPIRA.</p>
        </div>
        <Link href="/events/create" className="event-button event-button-primary events-create-button">
          <Plus size={16} /> Crear evento
        </Link>
      </div>

      <EventAdminTabs active="management" />

      <div className="event-metrics" aria-label="Resumen de eventos">
        <Metric value={events.length} label="Total de eventos" mobileLabel="Total" tone="orange" />
        <Metric value={publishedCount} label="Publicados" tone="blue" />
        <Metric value={draftCount} label="Borradores" tone="red" />
      </div>

      <section className="events-list-panel">
        <div className="events-filters">
          <input aria-label="Buscar" placeholder="Buscar eventos por título…" readOnly />
          <select aria-label="Fecha" defaultValue="all" disabled title="El filtrado no forma parte de HU1">
            <option value="all">Todas las fechas</option>
          </select>
          <select aria-label="Estado" defaultValue="all" disabled title="El filtrado no forma parte de HU1">
            <option value="all">Todos los estados</option>
          </select>
          <button type="button" className="event-button event-button-primary" disabled title="El filtrado no forma parte de HU1">Filtrar</button>
        </div>

        <h2>Listado de eventos</h2>

        {errorMessage ? <div className="event-feedback" role="alert">{errorMessage}</div> : null}
        {isLoading ? <p className="events-list-footer" role="status">Cargando eventos…</p> : null}

        <div className="events-table" role="table" aria-label="Listado de eventos">
          <div className="events-table-head" role="row">
            <span>Evento</span><span>Fecha y hora</span><span>Ubicación</span>
            <span>Cupo</span><span>Estado</span><span>Acciones</span>
          </div>
          {!isLoading && !errorMessage && events.map((event) => (
            <article className="events-table-row" role="row" key={event.id}>
              <div className="event-list-title">
                <span className="event-thumb">
                  {getEventInitials(event.title)}
                </span>
                <span>
                  <strong>{event.title}</strong>
                  <small>Creado por {event.createdBy} · {formatEventDate(event.createdAt)}</small>
                </span>
              </div>
              <span className="event-date"><strong>{formatEventDate(event.startDate)}</strong><small>{formatEventTimeRange(event)}</small></span>
              <span className="event-location">{event.location ?? 'Sin ubicación'}</span>
              <span className="event-capacity">{event.maxCapacity}</span>
              <StatusChip status={event.status} />
              <div className={`event-row-actions ${event.status === EVENT_STATUS.PUBLICADO ? 'is-published' : 'is-draft'}`}>
                {event.status === EVENT_STATUS.PUBLICADO ? (
                  <button type="button" className="event-button event-button-secondary event-action-view" disabled title="La ruta de detalle pertenece a HU2 y aún no existe">Ver</button>
                ) : event.status === EVENT_STATUS.BORRADOR ? (
                  <>
                    <button type="button" className="event-button event-button-secondary event-action-edit" onClick={() => router.push(`/events/drafts/${event.id}`)}>Editar</button>
                    <button type="button" className="event-button event-button-primary event-action-publish" onClick={() => setPendingPublication(event)} disabled={isPublishing}>Publicar</button>
                  </>
                ) : null}
                {event.status === EVENT_STATUS.PUBLICADO ? <MoreVertical size={18} aria-hidden="true" /> : null}
              </div>
            </article>
          ))}
        </div>
        {!isLoading && !errorMessage && events.length === 0 ? (
          <p className="events-list-footer" role="status">No hay eventos registrados.</p>
        ) : null}
        {!isLoading && !errorMessage && events.length > 0 ? (
          <p className="events-list-footer">Mostrando 1–{events.length} de {events.length} eventos</p>
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

      {publicationSucceeded ? (
        <EventSuccessDialog onBack={() => setPublicationSucceeded(false)} />
      ) : null}
    </main>
  );
}

export function EventDraftsContent({ userId }: { userId?: string }) {
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
  const [publicationSucceeded, setPublicationSucceeded] = useState(false);
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
      setPublicationSucceeded(true);
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
                <span>{formatEventDate(draft.startDate)}</span>
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

      {publicationSucceeded ? (
        <EventSuccessDialog onBack={() => router.push('/events')} />
      ) : null}
    </main>
  );
}

function Metric({ value, label, mobileLabel, tone }: { value: number; label: string; mobileLabel?: string; tone: string }) {
  return (
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

const eventDateFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const eventTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatEventDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : eventDateFormatter.format(date);
}

function formatEventTimeRange(event: EventItem): string {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 'Horario no disponible';
  }

  return `${eventTimeFormatter.format(start)}–${eventTimeFormatter.format(end)}`;
}

function getEventInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'EV';
}

function toEventSummary(event: EventItem): EventSummary {
  return {
    title: event.title,
    dateLabel: `${formatEventDate(event.startDate)} · ${formatEventTimeRange(event)}`,
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
            <span>{event.location || 'Ubicación por definir'} · Cupo {event.maxCapacity}</span>
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

export function EventSuccessDialog({ onBack }: { onBack: () => void }) {
  return (
    <div className="event-modal-layer" role="presentation">
      <section className="event-success-dialog" role="dialog" aria-modal="true" aria-labelledby="event-success-title">
        <span className="event-success-icon"><Check size={40} strokeWidth={3} /></span>
        <h2 id="event-success-title">¡Evento publicado correctamente!</h2>
        <p>El evento ya está disponible en el catálogo.</p>
        <div className="event-dialog-actions">
          <button type="button" className="event-button event-button-secondary event-back-button" onClick={onBack}>Volver a eventos</button>
          <button type="button" className="event-button event-button-primary event-view-button" disabled title="La ruta de detalle depende de HU2 y aún no existe">Ver evento</button>
        </div>
      </section>
    </div>
  );
}
