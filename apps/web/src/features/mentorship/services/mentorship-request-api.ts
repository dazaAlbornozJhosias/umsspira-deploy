import { authenticatedFetch, SessionError } from '@/shared/services/auth-session';
import { readApiError } from '@/shared/services/api-contract';

export const REQUEST_MESSAGE_LIMIT = 300;

export interface DirectoryMentor {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  experienceYears: number | null;
  areas: { id: string; name: string }[];
  availabilityStatus: 'AVAILABLE' | 'PAUSED' | null;
}

export interface MentorSlot {
  startTime: string;
  endTime: string;
}

export interface MentorSlotDay {
  date: string;
  slots: MentorSlot[];
}

export interface MentorshipRequestInput {
  mentorId: string;
  date: string;
  startTime: string;
  endTime: string;
  message?: string;
}

export interface CreatedMentorshipRequest {
  id: string;
  status: string;
}

export class MentorshipRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = 'MentorshipRequestError';
  }
}

export const FORBIDDEN_MESSAGE = 'Solo los titulados aprobados pueden enviar solicitudes de mentoría.';
export const SLOT_UNAVAILABLE_MESSAGE = 'El horario seleccionado ya no está disponible';

const codeMessages: Record<string, string> = {
  MENTOR_SLOT_UNAVAILABLE: SLOT_UNAVAILABLE_MESSAGE,
  MENTORSHIP_REQUEST_FORBIDDEN: FORBIDDEN_MESSAGE,
  MENTOR_NOT_AVAILABLE: 'El mentor no está habilitado para recibir solicitudes.',
  MENTORSHIP_REQUEST_SELF: 'No puedes solicitar una mentoría contigo mismo.',
  MENTORSHIP_REQUEST_PAST: 'Selecciona un horario futuro.',
  MENTOR_NOT_FOUND: 'El mentor seleccionado no existe.',
};

const statusMessages: Record<number, string> = {
  401: 'Inicia sesión para solicitar una mentoría.',
  403: FORBIDDEN_MESSAGE,
};

async function send(path: string, options: RequestInit, fallback: string): Promise<unknown> {
  let response: Response;
  try {
    response = await authenticatedFetch(path, {
      ...options,
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error instanceof SessionError) throw new MentorshipRequestError(error.message, error.status);
    throw new MentorshipRequestError(fallback, 0);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const { code } = readApiError(body, '');
    throw new MentorshipRequestError(
      (code && codeMessages[code]) || statusMessages[response.status] || fallback,
      response.status,
      code,
    );
  }
  return ((await response.json()) as { data?: unknown }).data;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

function invalid(): never {
  throw new MentorshipRequestError('El servidor devolvió datos con un formato inválido.', 0);
}

function parseMentor(value: unknown): DirectoryMentor {
  if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.areas)) invalid();
  return {
    id: value.id,
    name: typeof value.nombre === 'string' && value.nombre ? value.nombre : 'Mentor UMSS',
    description: typeof value.descripcion === 'string' ? value.descripcion : null,
    photoUrl: typeof value.foto_perfil === 'string' ? value.foto_perfil : null,
    experienceYears: typeof value.anios_exp === 'number' ? value.anios_exp : null,
    areas: value.areas.flatMap((area: unknown) =>
      isRecord(area) && typeof area.id === 'string' && typeof area.nombre === 'string'
        ? [{ id: area.id, name: area.nombre }]
        : [],
    ),
    availabilityStatus: value.availabilityStatus === 'AVAILABLE' || value.availabilityStatus === 'PAUSED'
      ? value.availabilityStatus
      : null,
  };
}

function parseDay(value: unknown): MentorSlotDay {
  if (!isRecord(value) || typeof value.fecha !== 'string' || !Array.isArray(value.horarios)) invalid();
  return {
    date: value.fecha,
    slots: value.horarios.map((slot: unknown) => {
      if (!isRecord(slot) || typeof slot.hora_inicio !== 'string' || typeof slot.hora_fin !== 'string') invalid();
      return { startTime: slot.hora_inicio, endTime: slot.hora_fin };
    }),
  };
}

export async function listMentorDirectory(signal?: AbortSignal): Promise<DirectoryMentor[]> {
  const data = await send(
    '/api/v1/mentorship/profiles',
    { method: 'GET', signal },
    'No se pudo cargar el directorio de mentores. Inténtalo de nuevo.',
  );
  if (!Array.isArray(data)) invalid();
  return data.map(parseMentor);
}

export async function checkMentorshipRequestAccess(signal?: AbortSignal): Promise<boolean> {
  const data = await send(
    '/api/v1/mentorship/eligibility',
    { method: 'GET', signal },
    'No se pudo verificar tu acceso. Inténtalo de nuevo.',
  );
  return isRecord(data) && data.eligible === true;
}

export async function getMentorSlots(mentorId: string, signal?: AbortSignal): Promise<MentorSlotDay[]> {
  const data = await send(
    `/api/v1/mentorship/profiles/${encodeURIComponent(mentorId)}/slots`,
    { method: 'GET', signal },
    'No se pudieron cargar los horarios del mentor. Inténtalo de nuevo.',
  );
  if (!Array.isArray(data)) invalid();
  return data.map(parseDay);
}

export async function createMentorshipRequest(
  input: MentorshipRequestInput,
  signal?: AbortSignal,
): Promise<CreatedMentorshipRequest> {
  const data = await send(
    '/api/v1/mentorship/requests',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentorId: input.mentorId,
        fecha: input.date,
        horaInicio: input.startTime,
        horaFin: input.endTime,
        ...(input.message ? { mensaje: input.message } : {}),
      }),
      signal,
    },
    'No se pudo enviar la solicitud. Inténtalo de nuevo.',
  );
  if (!isRecord(data) || typeof data.id !== 'string' || typeof data.estado !== 'string') invalid();
  return { id: data.id, status: data.estado };
}
