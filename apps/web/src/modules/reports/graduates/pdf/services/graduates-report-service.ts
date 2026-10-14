import { REPORT_MESSAGES, REPORT_TIME_ZONE, STATUS_LABEL } from '../constants/report-messages';
import { GraduateStatus, ReportPdfFile } from '../types/graduates-report.types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

// La API responde así cuando la ruta no existe; no significa que falten titulados
const ROUTE_NOT_FOUND = /^Cannot [A-Z]+ /;

// El estado elegido no tiene titulados (la API respondió 404 con su mensaje)
export class EmptyReportException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmptyReportException';
  }
}

// La API no pudo generar el PDF, o no hubo conexión
export class ReportGenerationException extends Error {
  constructor(message: string = REPORT_MESSAGES.generationError) {
    super(message);
    this.name = 'ReportGenerationException';
  }
}

// Fecha de hoy en la hora de Bolivia, como la arma la API: AAAAMMDD
function getTodayInBolivia(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: REPORT_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}${get('month')}${get('day')}`;
}

// Lee el nombre del archivo del encabezado: inline; filename="reporte-titulados-…pdf"
export function getFileNameFromDisposition(disposition: string | null, status: GraduateStatus): string {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  if (match) return match[1];
  return `reporte-titulados-${STATUS_LABEL[status]}-${getTodayInBolivia()}.pdf`;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    return typeof body?.message === 'string' ? body.message : null;
  } catch {
    return null;
  }
}

// Pide a la API el reporte PDF de los titulados del estado elegido.
// careerId es temporal: cuando exista el login, la API toma la carrera del token del administrador.
// signal permite cancelar el pedido (cambio de filtro o tiempo de espera agotado).
export async function fetchGraduatesReportPdf(
  status: GraduateStatus,
  careerId?: string,
  signal?: AbortSignal,
): Promise<ReportPdfFile> {
  const params = new URLSearchParams({ status });
  if (careerId) params.set('careerId', careerId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/graduates-report/pdf?${params.toString()}`, { signal });
  } catch {
    throw new ReportGenerationException();
  }

  if (response.status === 404) {
    // Sólo es «sin titulados» si lo dice la API; un 404 de otra cosa es una falla
    const message = await readErrorMessage(response);
    if (message && !ROUTE_NOT_FOUND.test(message)) throw new EmptyReportException(message);
    throw new ReportGenerationException();
  }
  if (!response.ok) {
    throw new ReportGenerationException();
  }

  let file: Blob;
  try {
    file = await response.blob();
  } catch {
    throw new ReportGenerationException();
  }
  if (!file.type.includes('pdf')) {
    throw new ReportGenerationException();
  }

  const fileName = getFileNameFromDisposition(response.headers.get('Content-Disposition'), status);
  return { file, fileName };
}
