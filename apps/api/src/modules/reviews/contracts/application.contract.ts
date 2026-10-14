import type { ApplicationStatus } from '@umsspira/shared-types';

// Estado canonico de la bandeja (el mismo de shared-types y del flujo de dictamen).
// La BD mezcla variantes en español (fun_registrar_solicitud) e inglés (dictamen),
// por eso todo se normaliza aqui antes de responder.
const STATUS_ALIASES: Record<string, ApplicationStatus> = {
  PENDING: 'PENDING',
  PENDIENTE: 'PENDING',
  PENDIENTE_DE_VALIDACION: 'PENDING',
  OBSERVED: 'OBSERVED',
  OBSERVADO: 'OBSERVED',
  APPROVED: 'APPROVED',
  APROBADO: 'APPROVED',
  REJECTED: 'REJECTED',
  RECHAZADO: 'REJECTED',
  RECHAZADA: 'REJECTED',
};

export function normalizeStatus(raw: unknown): ApplicationStatus {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '_');
  return STATUS_ALIASES[key] ?? 'PENDING';
}

// Variantes que existen en la BD para un estado canonico (para filtrar sin perder filas).
export function statusVariants(status: ApplicationStatus): string[] {
  return Object.entries(STATUS_ALIASES)
    .filter(([, canonical]) => canonical === status)
    .map(([alias]) => alias.replace(/_/g, ' '))
    .concat(
      Object.entries(STATUS_ALIASES)
        .filter(([, canonical]) => canonical === status)
        .map(([alias]) => alias),
    );
}

// Codigo visible del expediente (CA-04.1): TIT-AAAA-XXXXXX, determinista por solicitud.
export function applicationCode(id: string, fechaCreacion: string | null): string {
  const year = fechaCreacion ? new Date(fechaCreacion).getFullYear() : new Date().getFullYear();
  const short = String(id ?? '')
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase()
    .padStart(6, '0');
  return `TIT-${year}-${short}`;
}

export interface ApplicationListItem {
  id: string;
  code: string;
  fullName: string;
  email: string;
  ci: string;
  issuedIn: string;
  sisCode: string;
  career: string;
  careerId: string | null;
  status: ApplicationStatus;
  submittedAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  firstName: string;
  lastName: string;
  phone: string;
  graduationYear: number | null;
  documentName: string;
  documentPath: string | null;
  documentFormat: string;
}
