// Horario y periodos de la bandeja (CA-08.1 y CA-08.4).
// Bolivia usa UTC-4 todo el año (no tiene horario de verano), por eso el desplazamiento es fijo.
export const BOLIVIA_TIME_ZONE = 'America/La_Paz';
const BOLIVIA_UTC_OFFSET_HOURS = -4;
const HOUR_MS = 60 * 60 * 1000;

// Una solicitud pendiente se considera urgente cuando supera estas horas sin dictamen (CA-08.1).
export const URGENT_AFTER_HOURS = 48;

export const APPLICATION_PERIODS = ['last15', 'last30', 'semester1', 'semester2', 'custom'] as const;
export type ApplicationPeriod = (typeof APPLICATION_PERIODS)[number];

// PENDIENTE DE CONFIRMAR CON EL PO (CA-08.4): no es un calendario académico definitivo.
// Es el único lugar donde se definen los semestres; al acordarlos basta con cambiar estos valores.
export const SEMESTER_CALENDAR = {
  semester1: { from: { month: 1, day: 1 }, to: { month: 6, day: 30 } },
  semester2: { from: { month: 7, day: 1 }, to: { month: 12, day: 31 } },
} as const;

// Rango de fechas con inicio inclusivo (gte) y fin exclusivo (lt).
export interface DateRange {
  gte?: Date;
  lt?: Date;
}

export interface ApplicationPeriodInput {
  period: ApplicationPeriod;
  year?: number;
  from?: string;
  to?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

// Fecha 'AAAA-MM-DD' del día en Bolivia para un instante dado.
export function boliviaDate(instant: Date): string {
  return new Date(instant.getTime() + BOLIVIA_UTC_OFFSET_HOURS * HOUR_MS).toISOString().slice(0, 10);
}

// Suma o resta días a una fecha 'AAAA-MM-DD'.
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// Instante en que empieza ese día en Bolivia (00:00 hora local).
export function startOfBoliviaDay(date: string): Date {
  return new Date(`${date}T00:00:00${BOLIVIA_UTC_OFFSET_HOURS < 0 ? '-' : '+'}${pad(Math.abs(BOLIVIA_UTC_OFFSET_HOURS))}:00`);
}

// Hoy en Bolivia: desde las 00:00 de hoy hasta las 00:00 de mañana (CA-08.1).
export function todayRange(now: Date): Required<DateRange> {
  const today = boliviaDate(now);
  return { gte: startOfBoliviaDay(today), lt: startOfBoliviaDay(addDays(today, 1)) };
}

// Instante antes del cual una solicitud pendiente ya es urgente.
export function urgentCutoff(now: Date): Date {
  return new Date(now.getTime() - URGENT_AFTER_HOURS * HOUR_MS);
}

// Traduce el periodo elegido en la bandeja a un rango de fecha de registro (CA-08.4).
// «Últimos N días» cuenta N días de calendario en Bolivia, incluyendo hoy.
export function resolveApplicationPeriod(input: ApplicationPeriodInput, now: Date): DateRange {
  const today = boliviaDate(now);
  const tomorrowStart = startOfBoliviaDay(addDays(today, 1));

  switch (input.period) {
    case 'last15':
      return { gte: startOfBoliviaDay(addDays(today, -14)), lt: tomorrowStart };
    case 'last30':
      return { gte: startOfBoliviaDay(addDays(today, -29)), lt: tomorrowStart };
    case 'semester1':
    case 'semester2': {
      const year = input.year ?? Number(today.slice(0, 4));
      const { from, to } = SEMESTER_CALENDAR[input.period];
      const start = `${year}-${pad(from.month)}-${pad(from.day)}`;
      const end = `${year}-${pad(to.month)}-${pad(to.day)}`;
      return { gte: startOfBoliviaDay(start), lt: startOfBoliviaDay(addDays(end, 1)) };
    }
    case 'custom':
      // «Hasta» incluye todo el día elegido.
      return {
        ...(input.from ? { gte: startOfBoliviaDay(input.from) } : {}),
        ...(input.to ? { lt: startOfBoliviaDay(addDays(input.to, 1)) } : {}),
      };
  }
}