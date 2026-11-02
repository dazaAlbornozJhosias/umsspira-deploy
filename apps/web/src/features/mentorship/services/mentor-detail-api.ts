import { apiUrl } from '@/shared/services/api-contract';
import { authenticatedFetch, SessionError } from '@/shared/services/auth-session';
import { mentorDetailProfileSchema, type MentorDetailProfile } from '../model/mentor-detail';

export class MentorNotFoundError extends Error {
  constructor(message = 'Perfil no encontrado.') {
    super(message);
    this.name = 'MentorNotFoundError';
  }
}

/** Solo se muestran fotos con URL http(s) pública, igual que en el directorio. */
function publicPhoto(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** Obtiene el perfil público de un mentor: GET /api/v1/mentorship/profiles/:mentorId */
export async function getMentorDetail(
  mentorId: string,
  options?: { signal?: AbortSignal },
): Promise<MentorDetailProfile> {
  if (!mentorId || !mentorId.trim()) {
    throw new MentorNotFoundError();
  }

  const endpoint = apiUrl(`/api/v1/mentorship/profiles/${encodeURIComponent(mentorId)}`);

  const response = await authenticatedFetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
    signal: options?.signal,
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) {
    throw new SessionError(401, 'Inicia sesión nuevamente para consultar el perfil del mentor.');
  }

  // 400 (identificador inválido en la URL) y 404 (inexistente o no disponible) se muestran igual.
  if (response.status === 400 || response.status === 404) {
    throw new MentorNotFoundError();
  }

  if (!response.ok) {
    throw new Error('Ocurrió un problema al consultar el perfil del mentor. Revisa tu conexión e inténtalo nuevamente.');
  }

  const rawJson = (await response.json()) as { data?: unknown };
  const data = rawJson?.data ?? rawJson;

  const parsed = mentorDetailProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('No se pudo interpretar la respuesta del perfil del mentor. Inténtalo nuevamente.');
  }

  return { ...parsed.data, photoUrl: publicPhoto(parsed.data.photoUrl) };
}
