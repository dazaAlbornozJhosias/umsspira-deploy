// Import directo al módulo de afinidad para no arrastrar el resto del paquete
import { AFFINITY_AREAS, type AffinityArea, type AffinityVectorResponse } from '@umsspira/shared-types/src/affinity';
import { apiClient } from './api-client';
import affinityVectorMock from '../mocks/affinity-vector-mock.json';
import affinityConfigMock from '../mocks/affinity-config-mock.json';
import affinitySnapshotsMock from '../mocks/affinity-snapshots-mock.json';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const AFFINITY_ENDPOINT = '/affinity/me';
const AFFINITY_CALCULATE_ENDPOINT = '/affinity/calculate';
const AFFINITY_CONFIG_ENDPOINT = '/affinity/config';
export const RECALCULATE_TIMEOUT_MS = 7000;
// Por defecto se usa el mock a menos que explícitamente se desactive con 'false'
const USE_AFFINITY_MOCK = process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK !== 'false';

// Avanza en cada recálculo con mock para mostrar un radar distinto por intento
let snapshotIndex = 0;

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
  return apiClient.get<AffinityVectorResponse>(AFFINITY_ENDPOINT);
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

  return apiClient.post<AffinityVectorResponse>(AFFINITY_CALCULATE_ENDPOINT, {});
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RECALCULATE_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${AFFINITY_CALCULATE_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al recalcular afinidad`);
    }

    return (await response.json()) as AffinityVectorResponse;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('No se pudo actualizar tu radar');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
