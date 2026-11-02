'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CircleAlert, ChevronDown } from 'lucide-react';

import EventCard from '@/shared/components/event-card';
import { getEventCatalog } from '@/shared/services/events-service';
import { formatEventMonth, getEventMonthKey } from '@/shared/utils/event-date-time';
import { EVENT_STATUS, type EventItem } from '@umsspira/shared-types';
import Link from 'next/link';

type SortOrder = 'nearest' | 'furthest';

interface EventsCatalogPageProps {
  detailBasePath?: string;
}

export default function EventsCatalogPage({
  detailBasePath = '/events/catalog',
}: EventsCatalogPageProps) {
  const [catalogEvents, setCatalogEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('nearest');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const events = await getEventCatalog();

        if (isMounted) {
          setCatalogEvents(events);
          setErrorMessage(null);
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            'No se pudo cargar el catálogo de eventos. Intenta nuevamente más tarde.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(searchTerm.trim());
    setDateFilter(selectedMonth || 'all');
  }

  const visibleEvents = useMemo(() => {
    const normalizedSearch = appliedSearch.toLocaleLowerCase('es');
    const filteredEvents = catalogEvents.filter((event) => {
      const searchableText = [
        event.title,
        event.description ?? '',
        event.location ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const eventMonth = getEventMonthKey(event.startDate);
      const matchesSearch = searchableText.includes(normalizedSearch);
      const matchesDate = dateFilter === 'all' || eventMonth === dateFilter;

      return matchesSearch && matchesDate;
    });

    return [...filteredEvents].sort((firstEvent, secondEvent) => {
      const firstDate = new Date(firstEvent.startDate).getTime();
      const secondDate = new Date(secondEvent.startDate).getTime();

      return sortOrder === 'furthest'
        ? secondDate - firstDate
        : firstDate - secondDate;
    });
  }, [appliedSearch, catalogEvents, dateFilter, sortOrder]);

  const availableMonths = useMemo(() => (
    Array.from(new Set(catalogEvents.map((event) => getEventMonthKey(event.startDate))))
      .sort()
  ), [catalogEvents]);

  const availability = useMemo(() => visibleEvents.reduce(
    (counts, event) => {
      const isFull = event.currentCapacity !== undefined
        && event.currentCapacity >= event.maxCapacity;
      const isAvailable = event.status === EVENT_STATUS.PUBLICADO && !isFull;

      counts[isAvailable ? 'available' : 'unavailable'] += 1;
      return counts;
    },
    { available: 0, unavailable: 0 },
  ), [visibleEvents]);

  const resultsLabel = `${availability.available} ${availability.available === 1 ? 'evento disponible' : 'eventos disponibles'} · ${availability.unavailable} ${availability.unavailable === 1 ? 'no disponible' : 'no disponibles'}`;

  return (
    <main className="hu2-catalog-page">
      <div className="hu2-catalog-shell">
        <header className="hu2-catalog-header">
          <div className="hu2-catalog-heading">
            <h1>
              Eventos universitarios
            </h1>
            {!errorMessage && (isLoading || catalogEvents.length > 0) ? (
              <p>Descubre actividades, talleres y encuentros de la comunidad UMSS.</p>
            ) : null}
          </div>
          <nav className="hu2-catalog-tabs" aria-label="Secciones de eventos">
            <button type="button" className="is-active" aria-current="page">
              Explorar
            </button>
            <Link href="/portal/eventos/mis-eventos">Mis eventos</Link>
            <Link href="/mis-pases">Mis pases</Link>
          </nav>
        </header>

        {!errorMessage ? (
          <form
            aria-label="Filtros del catálogo"
            onSubmit={applySearch}
            className="hu2-catalog-filters"
          >
          <label className="hu2-catalog-control hu2-search-control">
            <span className="sr-only">Buscar eventos</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar eventos..."
              className="hu2-control-input"
            />
          </label>

          <label className="hu2-catalog-control hu2-date-control">
            <span className="sr-only">Filtrar por mes</span>
            <select
              aria-label="Filtrar por mes"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="hu2-control-input hu2-date-select"
            >
              <option value="">Todas las fechas</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>{formatEventMonth(month)}</option>
              ))}
            </select>
          </label>

          <label className="hu2-catalog-control hu2-sort-control">
            <span className="sr-only">Ordenar eventos</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="hu2-control-input hu2-sort-select"
            >
              <option value="nearest">Ordenar: fecha más próxima</option>
              <option value="furthest">Ordenar: fecha más lejana</option>
            </select>
            <ChevronDown size={15} className="hu2-sort-icon" aria-hidden="true" />
          </label>

          <button
            type="button"
            onClick={() => {
              setAppliedSearch(searchTerm.trim());
              setDateFilter(selectedMonth || 'all');
            }}
            className="hu2-search-button"
          >
            Buscar
          </button>
          </form>
        ) : null}

        {isLoading ? (
          <p className="hu2-catalog-loading" role="status">
            Cargando eventos...
          </p>
        ) : errorMessage ? (
          <section className="hu2-catalog-state hu2-error-state" role="alert">
            <span className="hu2-state-icon" aria-hidden="true"><CircleAlert size={52} /></span>
            <h2>No pudimos cargar los eventos</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </section>
        ) : (
          <>
            <p className="hu2-results-count">
              {resultsLabel}
            </p>
            {visibleEvents.length > 0 ? (
              <div className="hu2-event-grid">
                {visibleEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    detailBasePath={detailBasePath}
                  />
                ))}
              </div>
            ) : (
              <section className="hu2-catalog-state hu2-empty-state" role="status">
                <h2>{catalogEvents.length === 0 ? 'No hay eventos disponibles' : 'No encontramos eventos'}</h2>
                <p>
                  {catalogEvents.length === 0
                    ? 'El catálogo estará disponible cuando existan eventos publicados.'
                    : 'No hay coincidencias con los filtros actuales. Modifica la búsqueda o el mes seleccionado.'}
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}