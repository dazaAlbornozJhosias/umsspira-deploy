import { clearAccessToken, getAccessToken } from '@/shared/services/auth-session';
import { updateMentorAreas } from './mentor-areas-api';
import { normalizeInterests, type InterestArea, type InterestConfiguration } from '../model/mentor-interests';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const BASE = '/mentorship/interests';

export interface MentorInterestsState {
  catalog: InterestArea[];
  configuration: InterestConfiguration;
}

export class MentorInterestsError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function request(path: string, options: RequestInit): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new MentorInterestsError('Inicia sesión para configurar tus intereses.', 401);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'omit',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401 && getAccessToken() === token) clearAccessToken();
    let message = '';
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
      else if (Array.isArray(body?.message)) message = body.message.filter((item: unknown) => typeof item === 'string').join(' ');
    } catch { /* La respuesta de error puede no ser JSON. */ }
    const messages: Record<number, string> = {
      401: 'Inicia sesión para configurar tus intereses.',
      403: 'No tienes permiso para configurar estos intereses.',
      409: 'La selección cambió. Vuelve a intentar guardar para actualizarla.',
    };
    throw new MentorInterestsError(messages[response.status] || message || `No se pudieron procesar los intereses (HTTP ${response.status}).`, response.status);
  }
  return response.json();
}

interface ApiArea { id: string; nombre: string }
interface ApiInterest { id: string; nombre: string; area: ApiArea }

function isArea(value: unknown): value is ApiArea {
  return !!value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    && 'nombre' in value && typeof value.nombre === 'string';
}

function isInterest(value: unknown): value is ApiInterest {
  return isArea(value) && 'area' in value && isArea(value.area);
}

export async function getMentorInterests(signal?: AbortSignal): Promise<MentorInterestsState> {
  const [groups, interests] = await Promise.all([
    request(`${BASE}/catalog`, { method: 'GET', signal }),
    request(`${BASE}/mine`, { method: 'GET', signal }),
  ]);
  if (!Array.isArray(groups) || !Array.isArray(interests) || !interests.every(isInterest)) {
    throw new Error('El backend devolvió los intereses con un formato inválido.');
  }
  const catalog: InterestArea[] = groups.map((group: unknown) => {
    if (!group || typeof group !== 'object' || !('area' in group) || !isArea(group.area)
      || !('intereses' in group) || !Array.isArray(group.intereses)) {
      throw new Error('El backend devolvió el catálogo de intereses con un formato inválido.');
    }
    const area = group.area;
    if (!group.intereses.every((item: unknown) => isInterest(item) && item.area.id === area.id)) {
      throw new Error('El backend devolvió tópicos que no corresponden a su área.');
    }
    return { id: area.id, name: area.nombre, description: '', topics: group.intereses.map(item => ({ id: item.id, name: item.nombre })) };
  });
  return {
    catalog,
    configuration: normalizeInterests(catalog, {
      areaIds: catalog.map(area => area.id), topicIds: interests.map(item => item.id),
    }),
  };
}

export async function saveMentorInterests(configuration: InterestConfiguration): Promise<InterestConfiguration> {
  // Consulta lo persistido antes de cada intento: si hubo un fallo parcial,
  // el siguiente guardado aplica únicamente las operaciones que siguen pendientes.
  const current = await getMentorInterests();
  const desired = normalizeInterests(current.catalog, configuration);
  if (!desired.areaIds.length) throw new Error('Debes conservar al menos un área técnica.');
  if (desired.areaIds.length !== configuration.areaIds.length || desired.topicIds.length !== configuration.topicIds.length) {
    throw new Error('El catálogo cambió. Recarga la página para revisar las áreas y los intereses disponibles.');
  }
  if (current.configuration.areaIds.some(id => !desired.areaIds.includes(id))) {
    await updateMentorAreas(desired.areaIds);
  }
  const persisted = (await getMentorInterests()).configuration;
  const added = desired.topicIds.filter(id => !persisted.topicIds.includes(id));
  if (added.length) {
    await request(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: added }) });
  }
  for (const id of persisted.topicIds.filter(id => !desired.topicIds.includes(id))) {
    await request(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  const confirmed = (await getMentorInterests()).configuration;
  if (confirmed.areaIds.length !== desired.areaIds.length || confirmed.topicIds.length !== desired.topicIds.length
    || !desired.areaIds.every(id => confirmed.areaIds.includes(id)) || !desired.topicIds.every(id => confirmed.topicIds.includes(id))) {
    throw new Error('La configuración cambió mientras se guardaba. Vuelve a intentar para confirmar tu selección.');
  }
  return confirmed;
}
