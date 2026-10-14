export const NOT_AVAILABLE = 'No disponible';

// Convierte una fecha 'AAAA-MM-DD' (o ISO) a milisegundos en UTC; null si no es válida.
function toUtcTime(date: string | null | undefined): number | null {
  if (!date) return null;
  const time = Date.parse(date.length === 10 ? `${date}T00:00:00Z` : date);
  return Number.isNaN(time) ? null : time;
}

function pluralize(amount: number, singular: string, plural: string): string {
  return `${amount} ${amount === 1 ? singular : plural}`;
}

// Duración de la carrera en años y meses completos de calendario: «7 años, 9 meses».
// Es un dato calculado (titulación - ingreso), no se guarda en la base de datos.
export function calculateCareerDuration(
  admissionDate: string | null | undefined,
  graduationDate: string | null | undefined,
): string {
  const start = toUtcTime(admissionDate);
  const end = toUtcTime(graduationDate);
  if (start === null || end === null || end < start) return NOT_AVAILABLE;

  const from = new Date(start);
  const to = new Date(end);
  let totalMonths =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  // Un mes que todavía no se cumplió no cuenta (ej. del 22/02 al 05/03 no es un mes)
  if (to.getUTCDate() < from.getUTCDate()) totalMonths -= 1;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return pluralize(months, 'mes', 'meses');
  if (months === 0) return pluralize(years, 'año', 'años');
  return `${pluralize(years, 'año', 'años')}, ${pluralize(months, 'mes', 'meses')}`;
}

// Fecha en formato DD/MM/AAAA, como en la lista de titulados; «—» si falta.
export function formatDate(date: string | null | undefined): string {
  const time = toUtcTime(date);
  if (time === null) return '—';
  const d = new Date(time);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}
