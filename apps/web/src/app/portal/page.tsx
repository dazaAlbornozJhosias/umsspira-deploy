'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Calendar,
  Briefcase,
  Star,
  Users,
  ChevronRight,
  Bookmark,
  MapPin,
  Clock3,
} from 'lucide-react';

import umssBg from '@/shared/assets/images/14sept.webp';
import { getEventCatalog } from '@/shared/services/events-service';
import { formatEventCardSchedule } from '@/shared/utils/event-date-time';
import type { EventItem } from '@umsspira/shared-types';

const EVENT_TIME_ZONE = 'America/La_Paz';

function getEventDateBadge(startDate: string) {
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '---' };

  const parts = new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    timeZone: EVENT_TIME_ZONE,
  }).formatToParts(date);

  return {
    day: parts.find((part) => part.type === 'day')?.value ?? '--',
    month: (parts.find((part) => part.type === 'month')?.value ?? '---')
      .replace('.', '')
      .toLocaleUpperCase('es'),
  };
}

function getEventTimeRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Horario no disponible';
  }

  const formatter = new Intl.DateTimeFormat('es-BO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: EVENT_TIME_ZONE,
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function EventCover({ event }: { event: EventItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { day, month } = getEventDateBadge(event.startDate);

  return (
    <div className="relative h-40 bg-[#2C3B4D]">
      {event.imageUrl && !imageFailed ? (
        <Image
          src={event.imageUrl}
          alt={`Imagen del evento ${event.title}`}
          fill
          unoptimized
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={`Imagen no disponible para ${event.title}`}
          className="flex h-full items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#2C3B4D] text-amber-400"
        >
          <Calendar className="h-12 w-12" aria-hidden="true" />
        </div>
      )}

      <div
        aria-label={`Fecha: ${day} ${month}`}
        className="absolute bottom-0 left-5 z-10 min-w-14 translate-y-1/2 rounded-xl bg-[#B44735] px-3 py-2 text-center text-white shadow-md"
      >
        <span className="block text-xl font-bold leading-5">{day}</span>
        <span className="mt-1 block text-xs font-semibold leading-3">{month}</span>
      </div>
    </div>
  );
}

const quickLinks = [
  { href: '/portal/eventos', title: 'Eventos', text: 'Participa en los próximos eventos y actividades.', Icon: Calendar, iconStyle: 'bg-amber-50 text-amber-600' },
  { href: '/portal/empleos', title: 'Bolsa de trabajo', text: 'Encuentra nuevas oportunidades laborales.', Icon: Briefcase, iconStyle: 'bg-blue-50 text-blue-600' },
  { href: '/portal/beneficios', title: 'Beneficios', text: 'Accede a descuentos y convenios exclusivos.', Icon: Star, iconStyle: 'bg-amber-50 text-amber-600' },
  { href: '/portal/comunidad', title: 'Comunidad', text: 'Conecta con otros egresados.', Icon: Users, iconStyle: 'bg-slate-100 text-slate-700' },
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function Home() {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let isActive = true;

    void getEventCatalog()
      .then((catalog) => {
        if (isActive) {
          setEvents(catalog);
          setEventsError(false);
        }
      })
      .catch(() => {
        if (isActive) setEventsError(true);
      })
      .finally(() => {
        if (isActive) setIsLoadingEvents(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredQuickLinks = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return quickLinks;
    return quickLinks.filter(({ title, text }) =>
      normalize(`${title} ${text}`).includes(q)
    );
  }, [query]);

  const filteredEvents = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return events;
    return events.filter((ev) =>
      normalize(`${ev.title} ${ev.description ?? ''} ${ev.location ?? ''} ${formatEventCardSchedule(ev.startDate, ev.endDate)}`).includes(q)
    );
  }, [query, events]);

  const term = query.trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 w-full space-y-8 font-sans text-slate-900">
      {/* Banner principal */}
      <section className="relative w-full rounded-2xl overflow-hidden bg-[#111827] text-white p-6 sm:p-8 md:p-12 shadow-lg">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={umssBg}
            alt="Fondo Institucional UMSS"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#0F172A]/60"></div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Bienvenido a</h3>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">
            UMSS<span className="text-amber-500">PIRA</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base">Tu comunidad, siempre conectada.</p>

          <div className="pt-2">
            <form role="search" onSubmit={(e) => e.preventDefault()} className="relative max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar eventos, beneficios y empleos"
                placeholder="Busque eventos, beneficios, empleos..."
                className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </form>
          </div>
        </div>
      </section>

      {term && filteredQuickLinks.length === 0 && filteredEvents.length === 0 && (
        <p role="status" className="text-center text-sm text-slate-500">
          No se encontraron resultados para &ldquo;{term}&rdquo;.
        </p>
      )}

      {/* Accesos rápidos */}
      {filteredQuickLinks.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {filteredQuickLinks.map(({ href, title, text, Icon, iconStyle }) => (
            <Link
              key={href}
              href={href}
              className="h-full min-h-[44px] bg-[#F5F2EA] p-5 rounded-2xl border border-[#C9C1B1] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyle}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{text}</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Próximos eventos publicados */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-slate-900">Próximos eventos</h2>
          <Link
            href="/portal/eventos"
            className="min-h-[44px] px-2 text-xs font-semibold text-amber-600 hover:underline flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingEvents ? (
          <p role="status" className="text-sm text-slate-500">Cargando eventos publicados…</p>
        ) : eventsError ? (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar los eventos. Intenta nuevamente desde el catálogo.
          </p>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents.slice(0, 3).map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-2xl border border-[#C9C1B1] bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative">
                  <EventCover event={event} />
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                  >
                    <Bookmark
                      size={19}
                    />
                  </span>
                </div>
                <Link
                  href={`/portal/eventos/${encodeURIComponent(event.id)}`}
                  className="block space-y-2 p-5 pt-8 text-slate-700 transition-colors hover:bg-[#FCFAF5]"
                >
                  <h3 className="font-bold text-slate-900">{event.title}</h3>
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="shrink-0 text-rose-500" aria-hidden="true" />
                    <span>{event.location || 'Ubicación por definir'}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Clock3 size={16} className="shrink-0 text-amber-600" aria-hidden="true" />
                    <span>{getEventTimeRange(event.startDate, event.endDate)}</span>
                  </p>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p role="status" className="text-sm text-slate-500">
            {query.trim()
              ? 'No hay eventos que coincidan con la búsqueda.'
              : 'Todavía no hay eventos publicados próximos.'}
          </p>
        )}
      </section>
    </div>
  );
}