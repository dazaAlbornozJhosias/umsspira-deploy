import { GraduateStatus } from '../types/graduates-report.types';

const TIME_ZONE = 'America/La_Paz';

const FILE_STATUS: Record<GraduateStatus, string> = {
  verified: 'verificados',
  observed: 'observados',
};

// Día, mes y año de una fecha en la hora de Bolivia (evita que de noche salga el día siguiente).
function getLocalDateParts(date: Date): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { day: get('day'), month: get('month'), year: get('year') };
}

// Nombre del PDF: reporte-titulados-ESTADO-AAAAMMDD.pdf
export function buildReportFileName(status: GraduateStatus, date: Date): string {
  const { day, month, year } = getLocalDateParts(date);
  return `reporte-titulados-${FILE_STATUS[status]}-${year}${month}${day}.pdf`;
}

// Fecha de generación para el encabezado: DD/MM/AAAA
export function formatGenerationDate(date: Date): string {
  const { day, month, year } = getLocalDateParts(date);
  return `${day}/${month}/${year}`;
}
