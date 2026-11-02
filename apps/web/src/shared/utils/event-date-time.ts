import {
  EVENT_DATE_MAX_YEAR,
  EVENT_DATE_MIN_YEAR,
} from '@umsspira/shared-types';

const EVENT_TIME_ZONE = 'America/La_Paz';

const eventDateFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: EVENT_TIME_ZONE,
});

const eventTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: EVENT_TIME_ZONE,
});

const eventDateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: EVENT_TIME_ZONE,
});

const eventInputPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  hourCycle: 'h23', timeZone: EVENT_TIME_ZONE,
});

const eventMonthFormatter = new Intl.DateTimeFormat('es-BO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function toEventIsoDateTime(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(wallClockUtc)) {
    return `${date}T${time}:00`;
  }
  let instant = wallClockUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = eventInputPartsFormatter.formatToParts(new Date(instant));
    const zonedWallClockUtc = Date.UTC(
      Number(getDatePart(parts, 'year')), Number(getDatePart(parts, 'month')) - 1,
      Number(getDatePart(parts, 'day')), Number(getDatePart(parts, 'hour')),
      Number(getDatePart(parts, 'minute')),
    );
    const adjustedInstant = wallClockUtc - (zonedWallClockUtc - instant);
    if (adjustedInstant === instant) break;
    instant = adjustedInstant;
  }
  return new Date(instant).toISOString();
}

export function isEventInputDateValid(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (year < EVENT_DATE_MIN_YEAR || year > EVENT_DATE_MAX_YEAR) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

export function toDateTimeInputParts(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const [date = '', time = ''] = value.split('T');
    return {
      date,
      time: time.slice(0, 5),
    };
  }

  const parts = eventInputPartsFormatter.formatToParts(parsedDate);
  const date = [getDatePart(parts, 'year'), getDatePart(parts, 'month'), getDatePart(parts, 'day')].join('-');
  const time = `${getDatePart(parts, 'hour')}:${getDatePart(parts, 'minute')}`;

  return { date, time };
}

export function formatEventInputSchedule(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): string {
  if (!startDate) return 'Fecha por definir';

  const formattedStartDate = formatInputDate(startDate);
  const formattedStartTime = startTime || 'Hora por definir';

  if (endDate && endDate !== startDate) {
    return `${formattedStartDate} · ${formattedStartTime} / ${formatInputDate(endDate)} · ${endTime || 'Hora por definir'}`;
  }

  return `${formattedStartDate} · ${formattedStartTime}${endTime ? `–${endTime}` : ''}`;
}

export function formatEventSchedule(
  startValue: string,
  endValue: string,
): string {
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 'Horario no disponible';
  }

  if (getEventDateKey(start) === getEventDateKey(end)) {
    return `${eventDateFormatter.format(start)} · ${eventTimeFormatter.format(start)}–${eventTimeFormatter.format(end)}`;
  }

  return `${eventDateFormatter.format(start)} · ${eventTimeFormatter.format(start)} / ${eventDateFormatter.format(end)} · ${eventTimeFormatter.format(end)}`;
}

export function formatEventCardSchedule(
  startValue: string,
  endValue: string,
): string {
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Horario no disponible';
  }

  const startDate = formatEventCardDate(start);
  const startTime = eventTimeFormatter.format(start);
  const endTime = eventTimeFormatter.format(end);

  if (getEventDateKey(start) === getEventDateKey(end)) {
    return `${startDate} · ${startTime}–${endTime}`;
  }

  return `${startDate} · ${startTime} / ${formatEventCardDate(end)} · ${endTime}`;
}

export function formatEventDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : eventDateFormatter.format(date);
}

export function formatEventDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : eventDateTimeFormatter.format(date);
}

export function formatEventMonth(value: string): string {
  const month = new Date(`${value}-01T00:00:00Z`);
  return Number.isNaN(month.getTime())
    ? value
    : eventMonthFormatter.format(month);
}

export function getEventMonthKey(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 7);
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  }).formatToParts(date);

  return `${getDatePart(parts, 'year')}-${getDatePart(parts, 'month')}`;
}

function getEventDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  }).formatToParts(date);

  return [
    getDatePart(parts, 'year'),
    getDatePart(parts, 'month'),
    getDatePart(parts, 'day'),
  ].join('-');
}

function formatEventCardDate(date: Date): string {
  const parts = eventDateFormatter.formatToParts(date);
  const day = getDatePart(parts, 'day');
  const month = getDatePart(parts, 'month')
    .replace('.', '')
    .toLocaleUpperCase('es-BO');
  const year = getDatePart(parts, 'year');

  return `${day} ${month} ${year}`;
}

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

function formatInputDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const monthNames = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];

  return `${String(day).padStart(2, '0')} ${monthNames[month - 1] ?? ''} ${year}`;
}
