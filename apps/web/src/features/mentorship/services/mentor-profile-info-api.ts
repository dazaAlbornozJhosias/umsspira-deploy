import { getAccessToken, clearAccessToken } from '@/shared/services/auth-session';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export interface MentorProfileInformationData {
  descripcion: string | null;
  experiencia: string | null;
  informacion_relevante?: string | null;
  foto_perfil?: string | null;
  anios_exp?: number | null;
  fecha_actualizacion?: string | null;
}

export interface MentorProfileInformationState {
  exists: boolean;
  profile: MentorProfileInformationData | null;
}

export interface UpdateMentorProfilePayload {
  descripcion: string;
  experiencia: string;
  informacion_relevante?: string | null;
  foto_perfil?: string | null;
  anios_exp?: number;
}

export class MentorProfileInfoError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'MentorProfileInfoError';
  }
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = getAccessToken();
  if (!token) {
    throw new MentorProfileInfoError('Inicia sesión para gestionar la información de tu perfil de mentor.', 401);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'omit',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && getAccessToken() === token) {
      clearAccessToken();
    }

    let serverMessage = '';
    try {
      const body = await response.text();
      if (body) {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === 'object' && 'message' in parsed) {
          const message = parsed.message;
          serverMessage = Array.isArray(message)
            ? message.filter((item): item is string => typeof item === 'string').join('. ')
            : typeof message === 'string' ? message : '';
        }
      }
    } catch {
      // no JSON response
    }

    const messages: Record<number, string> = {
      401: 'Inicia sesión para gestionar la información de tu perfil.',
      403: 'Solo el mentor propietario puede modificar o consultar esta información.',
      404: 'No se encontró el perfil de mentor.',
      422: serverMessage || 'Los datos ingresados no son válidos.',
    };

    throw new MentorProfileInfoError(
      serverMessage || messages[response.status] || `Error del servidor (HTTP ${response.status}).`,
      response.status,
    );
  }

  return response.json();
}

/** GET /mentorship/my-profile/information */
export async function getMentorProfileInformation(): Promise<MentorProfileInformationState> {
  const data = await request('/mentorship/my-profile/information', { method: 'GET' });
  return data as MentorProfileInformationState;
}

/** PATCH /mentorship/my-profile/information */
export async function updateMentorProfileInformation(
  payload: UpdateMentorProfilePayload,
): Promise<MentorProfileInformationState> {
  const data = await request('/mentorship/my-profile/information', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return data as MentorProfileInformationState;
}

/** DELETE /mentorship/my-profile/information */
export async function deleteMentorProfileInformation(): Promise<MentorProfileInformationState> {
  const data = await request('/mentorship/my-profile/information', { method: 'DELETE' });
  return data as MentorProfileInformationState;
}
