import { z } from 'zod';
import type { MentorDirectoryResponse } from '@umsspira/shared-types';
import { apiUrl } from '@/shared/services/api-contract';
import { authenticatedFetch, ensureAccessToken, getAccessToken, SessionError } from '@/shared/services/auth-session';
import {
  filterDirectory, uniqueMentors,
  type DirectoryMentor, type DirectoryPage, type DirectoryQuery,
} from '../model/mentor-directory';

const areaReference = z.object({ id: z.string().min(1), nombre: z.string() });
const interestReference = areaReference.extend({ area: areaReference });

/**
 * Vocabulario público de `availabilityStatus` en el contrato del directorio (HU 6.7).
 * No confundir con los estados en español de PATCH /mentorship/availability.
 */
const directoryAvailabilityStatuses = ['AVAILABLE', 'PAUSED', 'UNAVAILABLE'] as const;
const directoryResponse: z.ZodType<MentorDirectoryResponse> = z.object({ data: z.array(z.object({
  id: z.string().min(1),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  foto_perfil: z.string().nullable(),
  esta_activo: z.boolean().nullable(),
  areas: z.array(areaReference),
  availabilityStatus: z.enum(directoryAvailabilityStatuses).nullable(),
  cargo: z.string().nullable(),
  empresa: z.string().nullable(),
  intereses: z.array(interestReference),
})), total: z.number().int().nonnegative(),
catalog: z.array(z.object({ area: areaReference, intereses: z.array(areaReference) })) });

function publicPhoto(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export async function getMentorDirectory(query: DirectoryQuery, signal?: AbortSignal): Promise<DirectoryPage> {
  const filtered = query.areaIds.length > 0 || query.topicIds.length > 0;
  // La API admite offset/limit. Los filtros por áreas e intereses se aplican
  // sobre la colección completa porque todavía no acepta esos parámetros.
  const params = new URLSearchParams({ offset: String(query.offset), limit: String(query.limit) });
  const endpoint = apiUrl('/api/v1/mentorship/profiles') + (filtered ? '' : `?${params}`);
  // El directorio exige sesión: nunca se consulta la API de forma anónima.
  if (!getAccessToken()) await ensureAccessToken();
  // Use the existing session client. No reads from other mentors' private endpoints.
  const response = await authenticatedFetch(endpoint, {
    method: 'GET', cache: 'no-store', credentials: 'omit', signal,
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) throw new SessionError(401, 'Inicia sesión nuevamente para consultar el directorio.');
  if (!response.ok) throw new Error('Ocurrió un problema al consultar los mentores. Revisa tu conexión e inténtalo nuevamente.');
  const parsed = directoryResponse.safeParse(await response.json());
  if (!parsed.success) throw new Error('No se pudo interpretar la respuesta del directorio. Inténtalo nuevamente.');
  // CA-F 03 explicitly requires AVAILABLE; paused and unknown states are excluded.
  const mentors: DirectoryMentor[] = uniqueMentors(parsed.data.data
    .filter(item => item.esta_activo === true && item.availabilityStatus === 'AVAILABLE')
    .map(item => ({
      id: item.id, name: item.nombre, description: item.descripcion,
      photoUrl: publicPhoto(item.foto_perfil), areas: item.areas.map(area => ({ id: area.id, name: area.nombre })),
      availability: item.availabilityStatus,
      profession: [item.cargo, item.empresa].filter(value => value?.trim()).join(' | ') || undefined,
      interests: item.intereses.map(interest => ({ id: interest.id, name: interest.nombre, areaId: interest.area.id })),
    })));
  const matches = filtered ? filterDirectory(mentors, query) : mentors;
  return {
    mentors: filtered ? matches.slice(query.offset, query.offset + query.limit) : matches,
    total: filtered ? matches.length : parsed.data.total,
    catalog: parsed.data.catalog.map(group => ({ id: group.area.id, name: group.area.nombre,
      description: '', topics: group.intereses.map(interest => ({ id: interest.id, name: interest.nombre })),
    })),
    interestsSupported: true,
  };
}
