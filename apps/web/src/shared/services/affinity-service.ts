
import {
  AFFINITY_AREAS,
  type AffinityArea,
  type AffinityVectorResponse,
  RADAR_AREA_IDS,
  type AffinityKeywordContribution,
} from '@umsspira/shared-types/src/affinity';

import { apiClient, apiFetch } from './api-client';

import affinityVectorMock from '../mocks/affinity-vector-mock.json';
import affinityConfigMock from '../mocks/affinity-config-mock.json';
import affinitySnapshotsMock from '../mocks/affinity-snapshots-mock.json';

const AREA_BY_ID = Object.fromEntries(
  Object.entries(RADAR_AREA_IDS).map(([area, id]) => [id, area]),
) as Record<string, AffinityArea>;

const AFFINITY_ENDPOINT = '/api/v1/radar';
const AFFINITY_CALCULATE_ENDPOINT = '/affinity/calculate';
const RADAR_RECALCULATE_ENDPOINT = '/api/v1/radar/recalculate';
const AFFINITY_CONFIG_ENDPOINT = '/affinity/config';

interface RadarApiArea {
  area: string;
  affinity: number;
  previousAffinity?: number | null;
  weighting?: number | null;
  topKeywords?: AffinityKeywordContribution[];
}

interface RadarApiResponse {
  graduateId: string;
  calculatedAt: string;
  hasLaborHistory?: boolean;
  status?: 'ok' | 'empty';
  algorithmVersion?: string;
  hasPendingChanges?: boolean;
  recalculated?: boolean;
  processingMs?: number;
  unmappedKeywords?: unknown[];
  areas: RadarApiArea[];
}

function normalizeArea(area: string): AffinityArea | undefined {
  if (AFFINITY_AREAS.includes(area as AffinityArea)) {
    return area as AffinityArea;
  }

  return AREA_BY_ID[area];
}

function adaptRadarResponse(
  response: RadarApiResponse,
): AffinityVectorResponse {
  const areas = response.areas
    .map((area) => {
      const normalizedArea = normalizeArea(area.area);

      if (!normalizedArea) {
        return undefined;
      }

      return {
        area: normalizedArea,
        affinity: area.affinity,
        previousAffinity: area.previousAffinity ?? null,
        weighting: area.weighting ?? null,
        topKeywords: area.topKeywords ?? [],
        keywords: (area.topKeywords ?? []).map((keyword) =>
          typeof keyword === 'string' ? keyword : keyword.keyword,
        ),
        evidence: [],
      };
    })
    .filter((area) => area !== undefined)
    .sort(
      (a, b) =>
        AFFINITY_AREAS.indexOf(a.area) -
        AFFINITY_AREAS.indexOf(b.area),
    );

  return {
    ...response,
    areas,
  } as AffinityVectorResponse;
}

export const RECALCULATE_TIMEOUT_MS = 7000;

const USE_AFFINITY_MOCK =
  process.env.NEXT_PUBLIC_USE_AFFINITY_MOCK === 'true';

let snapshotIndex = 0;

export interface AffinityAxisConfig {
  area: AffinityArea;
  weight: number | null;
}

export interface AffinityConfigPayload {
  axes: AffinityAxisConfig[];
}

function orderConfigAxes(
  payload: AffinityConfigPayload,
): AffinityConfigPayload {
  const positionByArea = new Map<string, number>(
    AFFINITY_AREAS.map((area, index) => [area, index]),
  );

  const axes = payload.axes
    .filter((axis) => positionByArea.has(axis.area))
    .sort(
      (a, b) =>
        (positionByArea.get(a.area) ?? 0) -
        (positionByArea.get(b.area) ?? 0),
    );

  return { axes };
}

export async function getAffinityVector(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    return affinityVectorMock as AffinityVectorResponse;
  }

  const response = await apiFetch<RadarApiResponse>(AFFINITY_ENDPOINT);

  return adaptRadarResponse(response);
}

export async function calculateAffinityVector(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      ...affinityVectorMock,
      calculatedAt: new Date().toISOString(),
    } as AffinityVectorResponse;
  }

  return apiClient.post<AffinityVectorResponse>(
    AFFINITY_CALCULATE_ENDPOINT,
    {},
  );
}

export async function getAffinityConfig(): Promise<AffinityConfigPayload> {
  const payload = USE_AFFINITY_MOCK
    ? (affinityConfigMock as AffinityConfigPayload)
    : {
        axes: (await getAffinityVector()).areas.map(({ area, weighting }) => ({
          area,
          weight: weighting ?? null,
        })),
      };

  return orderConfigAxes(payload);
}

export async function saveAffinityConfig(
  config: AffinityConfigPayload,
): Promise<void> {
  if (USE_AFFINITY_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  await apiClient.post<void>(AFFINITY_CONFIG_ENDPOINT, config);
}

export async function recalculateAffinity(): Promise<AffinityVectorResponse> {
  if (USE_AFFINITY_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const snapshot = affinitySnapshotsMock[snapshotIndex];

    snapshotIndex =
      (snapshotIndex + 1) % affinitySnapshotsMock.length;

    return {
      ...snapshot,
      calculatedAt: new Date().toISOString(),
    } as AffinityVectorResponse;
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    RECALCULATE_TIMEOUT_MS,
  );

  try {
    const response = await apiFetch<RadarApiResponse>(
      RADAR_RECALCULATE_ENDPOINT,
      {
        method: 'POST',
        signal: controller.signal,
      },
    );

    return adaptRadarResponse(response);
  } catch (error) {
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      throw new Error('No se pudo actualizar tu radar');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
