import { clearAccessToken, getAccessToken } from '@/shared/services/auth-session';

export const mentorAvailabilityStatuses = ['AVAILABLE', 'PAUSED', 'UNAVAILABLE'] as const;

export type MentorAvailabilityStatus = typeof mentorAvailabilityStatuses[number];

export interface MentorAvailability {
  availabilityStatus: MentorAvailabilityStatus | null;
  fecha_actualizacion: string | null;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export class MentorAvailabilityError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'MentorAvailabilityError';
  }
}

function isStatus(value: unknown): value is MentorAvailabilityStatus {
  return typeof value === 'string'
    && mentorAvailabilityStatuses.includes(value as MentorAvailabilityStatus);
}

function parseAvailability(value: unknown): MentorAvailability {
  if (!value || typeof value !== 'object' || !('availabilityStatus' in value)
    || (value.availabilityStatus !== null && !isStatus(value.availabilityStatus))
    || !('fecha_actualizacion' in value)
    || (value.fecha_actualizacion !== null && typeof value.fecha_actualizacion !== 'string')) {
    throw new Error('El servidor devolvió un estado de disponibilidad con formato inválido.');
  }

  return {
    availabilityStatus: value.availabilityStatus,
    fecha_actualizacion: value.fecha_actualizacion,
  };
}

async function requestAvailability(options: RequestInit, action: 'consultar' | 'actualizar') {
  const token = getAccessToken();
  if (!token) {
    throw new MentorAvailabilityError('Inicia sesión para configurar tu disponibilidad.', 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/mentorship/availability`, {
      ...options,
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json', ...options.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new MentorAvailabilityError(
      action === 'actualizar'
        ? 'No se pudo actualizar la disponibilidad. Inténtalo de nuevo.'
        : 'No se pudo cargar la disponibilidad. Revisa tu conexión e inténtalo de nuevo.',
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 401 && getAccessToken() === token) clearAccessToken();
    const messages: Record<number, string> = {
      401: 'Inicia sesión para configurar tu disponibilidad.',
      403: 'Acceso denegado. Se requiere un perfil de mentor activo.',
      404: 'No se encontró el perfil de mentor.',
    };
    throw new MentorAvailabilityError(
      messages[response.status]
        || (action === 'actualizar'
          ? 'No se pudo actualizar la disponibilidad. Inténtalo de nuevo.'
          : 'No se pudo cargar la disponibilidad. Inténtalo de nuevo.'),
      response.status,
    );
  }

  try {
    return parseAvailability(await response.json());
  } catch (error) {
    if (error instanceof MentorAvailabilityError) throw error;
    throw new Error('El servidor devolvió un estado de disponibilidad con formato inválido.');
  }
}

export function getMentorAvailability(signal?: AbortSignal): Promise<MentorAvailability> {
  return requestAvailability({ method: 'GET', signal }, 'consultar');
}

export function updateMentorAvailability(
  availabilityStatus: MentorAvailabilityStatus,
  signal?: AbortSignal,
): Promise<MentorAvailability> {
  return requestAvailability({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availabilityStatus }),
    signal,
  }, 'actualizar');
}
