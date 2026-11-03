// Import directo al módulo de afinidad para no arrastrar el resto del paquete
import {
  AFFINITY_AREAS,
  RADAR_AREA_IDS,
  type AffinityArea,
  type AffinityVectorResponse,
} from '@umsspira/shared-types/src/affinity';
import { apiClient } from './api-client';
import { apiUrl } from './api-contract';
import { csrfToken, getAccessToken, refreshSession } from './auth-session';
import affinityVectorMock from '../mocks/affinity-vector-mock.json';
import affinityConfigMock from '../mocks/affinity-config-mock.json';
import affinitySnapshotsMock from '../mocks/affinity-snapshots-mock.json';

const AFFINITY_ENDPOINT = '/api/v1/radar';
const AFFINITY_CALCULATE_ENDPOINT = '/api/v1/radar/recalculate';
const AFFINITY_CONFIG_ENDPOINT = '/affinity/config';
export const RECALCULATE_TIMEOUT_MS = 7000;
// Por defecto consulta la API real; el mock solo se activa cuando se solicita explícitamente con 'true'
const USE_AFFINITY_MOCK = process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK === 'true';

// Avanza en cada recálculo con mock para mostrar un radar distinto por intento
let snapshotIndex = 0;

const AREA_SLUG_BY_ID = new Map<string, AffinityArea>(
  (Object.entries(RADAR_AREA_IDS) as Array<[AffinityArea, string]>).map(([slug, id]) => [id, slug]),
);

type RawAffinityAreaItem = {
  area: string;
  affinity: number;
  keywords?: string[];
  topKeywords?: Array<string | { term?: string }>;
  evidence?: unknown[];
};

function buildAuthHeaders(initial?: HeadersInit): Headers {
  const headers = new Headers(initial);
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const csrf = csrfToken();
  if (csrf && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrf);
  }
  return headers;
}

function normalizeAffinityVectorResponse(raw: unknown): AffinityVectorResponse {
  const unwrapped =
    raw && typeof raw === 'object' && 'data' in raw && (raw as { data?: unknown }).data
      ? (raw as { data: Record<string, unknown> }).data
      : (raw as Record<string, unknown>);

  if (!unwrapped || typeof unwrapped !== 'object') {
    throw new Error('No se pudo actualizar tu radar');
  }

  const rawAreas = Array.isArray(unwrapped.areas) ? (unwrapped.areas as RawAffinityAreaItem[]) : [];
  const isBackendEmpty = unwrapped.status === 'empty';

  const areas = isBackendEmpty
    ? []
    : rawAreas.map((item) => {
        const mappedArea = (AREA_SLUG_BY_ID.get(item.area) ?? item.area) as AffinityArea;
        const normalizedTopKeywords = Array.isArray(item.topKeywords)
          ? item.topKeywords
              .map((kw) => (typeof kw === 'string' ? kw : kw?.term ?? ''))
              .filter((kw): kw is string => kw.length > 0)
          : undefined;
        const keywords = item.keywords ?? normalizedTopKeywords;

        return {
          ...item,
          area: mappedArea,
          ...(keywords !== undefined ? { keywords } : {}),
        };
      });

  return {
    ...(unwrapped as unknown as AffinityVectorResponse),
    areas,
  };
}

async function requestAffinityWithTimeout(
  endpoint: string,
  options: RequestInit,
  errorContext: string,
): Promise<AffinityVectorResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RECALCULATE_TIMEOUT_MS);

  try {
    let response = await fetch(apiUrl(endpoint), {
      ...options,
      credentials: 'same-origin',
      headers: buildAuthHeaders(options.headers),
      signal: controller.signal,
    });

    if (response.status === 401 && csrfToken()) {
      const renewedToken = await refreshSession();
      const retryHeaders = buildAuthHeaders(options.headers);
      retryHeaders.set('Authorization', `Bearer ${renewedToken}`);
      response = await fetch(apiUrl(endpoint), {
        ...options,
        credentials: 'same-origin',
        headers: retryHeaders,
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      throw Object.assign(new Error(`Error ${response.status} al ${errorContext}`), {
        status: response.status,
      });
    }

    const data = await response.json();
    return normalizeAffinityVectorResponse(data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('No se pudo actualizar tu radar');
    }
    if (err instanceof TypeError) {
      throw new Error('No se pudo actualizar tu radar');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface AffinityAxisConfig {
  area: AffinityArea;
  weight: number;
}

export interface AffinityConfigPayload {
  axes: AffinityAxisConfig[];
}

/**
 * Reordena los ejes según el orden fijo de AFFINITY_AREAS.
 * El orden de presentación lo fija el cliente, no el origen de los datos.
 */
function orderConfigAxes(payload: AffinityConfigPayload): AffinityConfigPayload {
  const positionByArea = new Map<string, number>(AFFINITY_AREAS.map((area, index) => [area, index]));
  const axes = payload.axes
    .filter((axis) => positionByArea.has(axis.area))
    .sort((a, b) => (positionByArea.get(a.area) ?? 0) - (positionByArea.get(b.area) ?? 0));
  return { axes };
}

/**
 * Obtiene el vector de afinidad actual del graduado.
 *
 * @returns Promesa con los datos del vector de afinidad.
 */
export async function getAffinityVector(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    return affinityVectorMock as AffinityVectorResponse;
  }
  return requestAffinityWithTimeout(AFFINITY_ENDPOINT, { method: 'GET' }, 'consultar afinidad');
}

/**
 * Solicita el cálculo del vector de afinidad del graduado.
 *
 * @returns Promesa con los datos del vector de afinidad calculado.
 */
export async function calculateAffinityVector(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    // Simula retardo de red de 1 segundo para apreciar el spinner de carga
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      ...affinityVectorMock,
      calculatedAt: new Date().toISOString(),
    } as AffinityVectorResponse;
  }

  return requestAffinityWithTimeout(
    AFFINITY_CALCULATE_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    'recalcular afinidad',
  );
}

/**
 * Obtiene la configuración de ejes y ponderaciones del radar.
 * Las ponderaciones las calcula el sistema; mientras la tabla no exista se
 * leen del mock local y con mock desactivado se consultan en AFFINITY_CONFIG_ENDPOINT.
 */
export async function getAffinityConfig(): Promise<AffinityConfigPayload> {
  const payload = USE_AFFINITY_MOCK
    ? (affinityConfigMock as AffinityConfigPayload)
    : await apiClient.get<AffinityConfigPayload>(AFFINITY_CONFIG_ENDPOINT);
  return orderConfigAxes(payload);
}

/**
 * Guarda la configuración de ejes y ponderaciones del radar.
 * Acepta un payload con la lista de ejes configurados.
 */
export async function saveAffinityConfig(config: AffinityConfigPayload): Promise<void> {
  if (USE_AFFINITY_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }
  await apiClient.post<void>(AFFINITY_CONFIG_ENDPOINT, config);
}

/**
 * Recalcula el vector de afinidad con un timeout de 7 segundos.
 *
 * El timeout cubre casos de red lenta o servidor sin respuesta. Al abortar,
 * se lanza un error con el mismo mensaje que muestra la UI de error sobre el
 * radar para que la persona sepa que puede reintentar.
 *
 * Si el recálculo falla, el último radar válido se conserva en la UI porque
 * el estado candidateAreas solo se actualiza cuando la petición es exitosa.
 */
export async function recalculateAffinity(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Rotación entre los snapshots: cada recálculo responde con un radar distinto
    const snapshot = affinitySnapshotsMock[snapshotIndex];
    snapshotIndex = (snapshotIndex + 1) % affinitySnapshotsMock.length;
    return {
      ...snapshot,
      calculatedAt: new Date().toISOString(),
    } as AffinityVectorResponse;
  }

  return requestAffinityWithTimeout(
    AFFINITY_CALCULATE_ENDPOINT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    'recalcular afinidad',
  );
}
