import type { EventItem } from '@umsspira/shared-types';
import Link from 'next/link';

export interface EventCardProps {
  event: EventItem;
}

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  const dateParts = dateFormatter.formatToParts(date);
  const day = dateParts.find(({ type }) => type === 'day')?.value;
  const month = dateParts
    .find(({ type }) => type === 'month')
    ?.value.replace('.', '')
    .toLocaleUpperCase('es-BO');
  const year = dateParts.find(({ type }) => type === 'year')?.value;

  return `${day} ${month} ${year}`;
}

function formatEventTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return timeFormatter.format(date);
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = formatEventDate(event.startDate);
  const startTime = formatEventTime(event.startDate);
  const endTime = formatEventTime(event.endDate);

  return (
    <article className="flex min-h-[292px] w-full flex-col overflow-hidden rounded-[14px] border border-[#C9C1B1] bg-white shadow-[0_6px_18px_rgba(27,38,50,0.12)]">
      <header className="relative flex h-[126px] shrink-0 items-center overflow-hidden bg-[#2C3B4D] px-5 py-4">
        <span
          aria-hidden="true"
          className="absolute left-0 top-6 h-[78px] w-1.5 rounded-r-full bg-[#FFB162]"
        />
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-12 h-32 w-32 rounded-full border border-[#EEE9DF]/15"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-16 right-10 h-28 w-28 rounded-full bg-[#EEE9DF]/[0.06]"
        />
        <span
          aria-hidden="true"
          className="absolute right-5 top-8 h-4 w-4 rounded-full bg-[#FFB162]/30"
        />

        <div className="relative min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EEE9DF]">
            Evento universitario
          </p>
          <h2 className="mt-2 line-clamp-2 text-[22px] font-semibold leading-[1.15] text-white">
            {event.title}
          </h2>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-5 py-4">
        <h3 className="line-clamp-1 text-lg font-semibold leading-6 text-[#1B2632]">
          {event.title}
        </h3>

        {event.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#2C3B4D]">
            {event.description}
          </p>
        ) : null}

        <div className="mt-3 space-y-1 text-[11px] leading-4 text-[#2C3B4D]">
          <p className="font-medium uppercase tracking-[0.04em]">
            {eventDate} <span aria-hidden="true">·</span>{' '}
            <span className="whitespace-nowrap">
              {startTime}–{endTime}
            </span>
          </p>
          <p>
            {event.location === null
              ? 'Ubicación no especificada'
              : `Ubicación: ${event.location}`}
          </p>
          <p>Cupo máximo: {event.maxCapacity}</p>
        </div>

        <div className="mt-auto flex justify-end pt-3">
          <Link
            href={`/events/catalog/${event.id}`}
            className="inline-flex h-[38px] items-center justify-center rounded-[9px] bg-[#FFB162] px-5 text-[13px] font-semibold text-[#1B2632] transition-colors hover:bg-[#F5A552] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3B4D]"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
