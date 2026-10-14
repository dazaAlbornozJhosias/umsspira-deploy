import type { MentorState } from '@umsspira/shared-types';
import { getAccessToken, clearAccessToken } from '@/shared/services/auth-session';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const MISSING_PROFILE = Symbol('missing-profile');

function isMentorResponse(value: unknown): value is { esta_activo: boolean | null } {
  if (!value || typeof value !== 'object') return false;
  const state = value as { esta_activo?: unknown };
  return typeof state.esta_activo === 'boolean' || state.esta_activo === null;
}

async function request(path: string, options: RequestInit, allowMissingProfile = false): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Inicia sesión para consultar tu participación como mentor.');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'omit',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401 && getAccessToken() === token) clearAccessToken();
    if (allowMissingProfile && response.status === 404) {
      const error: unknown = await response.json();
      if (error && typeof error === 'object' && 'message' in error
        && error.message === 'El usuario no tiene perfil de mentor') return MISSING_PROFILE;
    }
    const messages: Record<number, string> = {
      401: 'Inicia sesión para consultar tu participación como mentor.',
      403: 'No tienes permiso o no cumples los requisitos para esta operación.',
      404: 'El backend no tiene disponible el endpoint de perfil de mentor.',
    };
    throw new Error(messages[response.status] || `El backend respondió con un error (HTTP ${response.status}).`);
  }
  const data: unknown = await response.json();
  return data;
}

async function getEligibility(signal?: AbortSignal): Promise<boolean> {
  const data = await request('/mentorship/eligibility', { method: 'POST', signal });
  if (!data || typeof data !== 'object' || !('eligible' in data) || typeof data.eligible !== 'boolean') {
    throw new Error('El backend devolvió la elegibilidad con un formato inválido.');
  }
  return data.eligible;
}

function toMentorState(data: unknown, eligible: boolean): MentorState {
  if (!isMentorResponse(data)) throw new Error('El backend devolvió un perfil de mentor con un formato inválido.');
  return { isActive: data.esta_activo === true, requirements: { egresado: eligible } };
}

export async function getMentorProfile(signal?: AbortSignal): Promise<MentorState> {
  const eligible = await getEligibility(signal);
  const data = await request('/mentorship/my-profile', { method: 'GET', signal }, true);
  if (data === MISSING_PROFILE) return { isActive: false, requirements: { egresado: eligible } };
  return toMentorState(data, eligible);
}

export async function updateMentorParticipation(isActive: boolean, signal?: AbortSignal): Promise<MentorState> {
  const eligible = await getEligibility(signal);
  const data = await request('/mentorship/my-profile/participation', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ esta_activo: isActive }),
    signal,
  });
  return toMentorState(data, eligible);
}
