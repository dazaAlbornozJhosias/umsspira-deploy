import type {
  Graduate,
  GraduateStatus,
} from '../data/graduates.mock';
import { authenticatedFetch } from '@/shared/services/auth-session';

export interface DashboardIndicators {
  totalGraduates: number;
  verifiedGraduates: number;
  observedGraduates: number;
  activeMentors: number;
}

interface GraduateRecordResponse {
  id: string;
  idCarrera: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaTitulacion: string | null;
  fechaIngreso: string | null;
  ci: string;
  extensionCi: string;
  anioEgreso: number;
  codSis: string;
  deseaMentor: boolean;
  estado: 'PENDIENTE' | 'APROBADA' | 'OBSERVADA' | 'RECHAZADA';
  fechaCreacion: string;
  fechaRevision: string | null;
  justificacion?: string;
}

interface GraduatesResponse {
  data: {
    items: GraduateRecordResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const API_BASE_URL = '/api/v1';

export async function getDashboardIndicators(): Promise<DashboardIndicators> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/reports/metrics`,
  );

  if (!response.ok) {
    throw new Error('No se pudieron cargar los indicadores del dashboard');
  }

  return (await response.json()).data;
}

export async function getGraduates(): Promise<Graduate[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/reports/graduates?page=1&limit=1000`,
  );

  if (!response.ok) {
    throw new Error('No se pudo cargar el padrón de titulados');
  }

  const payload = (await response.json()) as GraduatesResponse;

  const records = [...payload.data.items];
  for (let page = 2; page <= payload.data.totalPages; page++) {
    const next = await authenticatedFetch(`${API_BASE_URL}/reports/graduates?page=${page}&limit=1000`);
    if (!next.ok) throw new Error('No se pudo cargar el padrón de titulados');
    const nextPage = await next.json() as GraduatesResponse;
    records.push(...nextPage.data.items);
  }

  return records.filter((record) => record.estado === 'APROBADA' || record.estado === 'OBSERVADA').map((record) => ({
    id: record.id,
    registrationNumber: `#REG-${record.anioEgreso}-${record.id.slice(-4)}`,
    fullName: `${record.apellido}, ${record.nombre}`,
    sisCode: record.codSis,
    phone: record.telefono,
    email: record.email,
    admissionDate: formatDate(record.fechaIngreso),
    degreeDate: record.fechaTitulacion
      ? formatDate(record.fechaTitulacion)
      : null,
    studyDuration: calculateDuration(
      record.fechaIngreso,
      record.fechaTitulacion,
    ),
    reviewDate: formatDate(record.fechaRevision ?? record.fechaCreacion),
    rejectionReason: record.justificacion ?? null,
    status: (record.estado === 'APROBADA' ? 'VERIFICADO' : 'OBSERVADO') as GraduateStatus,
  }));
}

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }

  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function calculateDuration(
  startValue: string | null,
  endValue: string | null,
): string {
  const start = parseIsoDate(startValue);
  const end = parseIsoDate(endValue);

  if (!start || !end || end < start) {
    return '';
  }

  let totalMonths =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());

  if (end.getUTCDate() < start.getUTCDate()) {
    totalMonths -= 1;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return `${years} ${years === 1 ? 'año' : 'años'}, ${months} ${
    months === 1 ? 'mes' : 'meses'
  }`;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}
