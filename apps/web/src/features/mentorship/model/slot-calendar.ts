import type { MentorSlotDay } from '../services/mentorship-request-api';

export interface CalendarCell {
  date: string;
  day: number;
  slotCount: number;
}

export interface CalendarMonth {
  key: string;
  label: string;
  leadingBlanks: number;
  cells: CalendarCell[];
}

const monthFormatter = new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const longDateFormatter = new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const toUtc = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export function formatLongDate(date: string): string {
  const text = longDateFormatter.format(toUtc(date));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Genera los meses completos del rango; los días sin horarios quedan con slotCount 0.
export function buildCalendarMonths(days: MentorSlotDay[]): CalendarMonth[] {
  const slotsByDate = new Map(days.map((entry) => [entry.date, entry.slots.length]));
  const months = new Map<string, CalendarMonth>();
  for (const { date } of days) {
    const key = date.slice(0, 7);
    if (months.has(key)) continue;
    const first = toUtc(`${key}-01`);
    const total = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const label = monthFormatter.format(first);
    months.set(key, {
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      leadingBlanks: (first.getUTCDay() + 6) % 7,
      cells: Array.from({ length: total }, (_, index) => {
        const day = index + 1;
        const value = `${key}-${String(day).padStart(2, '0')}`;
        return { date: value, day, slotCount: slotsByDate.get(value) ?? 0 };
      }),
    });
  }
  return Array.from(months.values());
}
