import type { ReportStatus } from '../entities/graduate-report';

export const REPORT_LABELS: Record<ReportStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobado',
  OBSERVADA: 'Observado',
  RECHAZADA: 'Rechazado',
};

export function reportDate(value: Date | null): string {
  if (!value) {
    return 'No disponible';
  }
  return value.toISOString().slice(0, 10).split('-').reverse().join('/');
}

export function careerDuration(start: Date | null, end: Date | null): string {
  if (!start || !end || end < start) {
    return 'No disponible';
  }
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearText = years + (years === 1 ? ' año' : ' años');
  const monthText = rest + (rest === 1 ? ' mes' : ' meses');
  return years === 0 ? monthText : rest === 0 ? yearText : yearText + ', ' + monthText;
}
