import type {
  Graduate,
  GraduateStatus,
} from '../data/graduates.mock';

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
  estado: GraduateStatus;
  fechaCreacion: string;
  justificacion?: string;
}

interface GraduatesResponse {
  data: GraduateRecordResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

export async function getDashboardIndicators(): Promise<DashboardIndicators> {
  const response = await fetch(
    `${API_BASE_URL}/reports/dashboard/indicators`,
  );

  if (!response.ok) {
    throw new Error('No se pudieron cargar los indicadores del dashboard');
  }

  return response.json();
}

export async function getGraduates(): Promise<Graduate[]> {
  const response = await fetch(
    `${API_BASE_URL}/reports/graduates?page=1&limit=1000`,
  );

  if (!response.ok) {
    throw new Error('No se pudo cargar el padrón de titulados');
  }

  const payload = (await response.json()) as GraduatesResponse;

  return payload.data.map((record) => ({
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
    reviewDate: formatDate(record.fechaCreacion),
    rejectionReason: record.justificacion ?? null,
    status: record.estado,
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
