import { AFFINITY_AREAS, RADAR_AREA_IDS } from '@umsspira/shared-types';
import type { RadarVector } from '../../application/contracts/radar-vector';
import { presentAffinityVector } from './affinity-vector.presenter';

function buildVector(overrides: Partial<RadarVector> = {}): RadarVector {
  return {
    graduateId: '10000000-0000-4000-8000-000000000002',
    hasLaborHistory: true,
    calculatedAt: new Date('2026-10-22T12:00:00.000Z'),
    status: 'ok',
    algorithmVersion: '1.0.0/2026-10-22.1',
    hasPendingChanges: false,
    processingMs: 12.6,
    areas: [],
    unmappedKeywords: ['xylophone', 'xylophone', ''],
    ...overrides,
  };
}

describe('presentAffinityVector - contrato HTTP del radar', () => {
  it('emite siempre las seis areas en el orden fijo de AFFINITY_AREAS', () => {
    const response = presentAffinityVector(
      buildVector({
        areas: [
          {
            areaId: RADAR_AREA_IDS['it-management'],
            affinity: 10,
            previousAffinity: null,
            weighting: 3,
            topKeywords: [],
          },
          {
            areaId: RADAR_AREA_IDS['software-development'],
            affinity: 50,
            previousAffinity: 40,
            weighting: 5,
            topKeywords: [],
          },
        ],
      }),
    );

    expect(response.areas.map(({ area }) => area)).toEqual([...AFFINITY_AREAS]);
    expect(response.areas).toHaveLength(6);
  });

  it('completa en cero las areas ausentes en una fila historica', () => {
    const response = presentAffinityVector(buildVector());

    for (const area of response.areas) {
      expect(area).toEqual({
        area: area.area,
        affinity: 0,
        previousAffinity: null,
        weighting: null,
        topKeywords: [],
      });
    }
  });

  it('publica solo los campos exactos de cada keyword y nunca undefined', () => {
    const response = presentAffinityVector(
      buildVector({
        areas: [
          {
            areaId: RADAR_AREA_IDS['software-development'],
            affinity: 12.5,
            previousAffinity: null,
            weighting: 5,
            topKeywords: [
              {
                keyword: 'javascript',
                weight: 5,
                frequency: 3,
                points: 15,
                percentage: 37.5,
                // Campos extra de una fila antigua que no deben viajar al contrato.
                term: 'javascript',
              } as never,
            ],
          },
        ],
      }),
    );

    const software = response.areas[0];
    const topKeywords = software.topKeywords ?? [];

    expect(topKeywords).toEqual([
      { keyword: 'javascript', weight: 5, frequency: 3, points: 15, percentage: 37.5 },
    ]);
    expect(Object.keys(topKeywords[0]).sort()).toEqual(
      ['keyword', 'weight', 'frequency', 'points', 'percentage'].sort(),
    );
    for (const area of response.areas) {
      expect(Array.isArray(area.topKeywords)).toBe(true);
      expect(area.previousAffinity === null || typeof area.previousAffinity === 'number').toBe(
        true,
      );
    }
  });

  it('satura affinity y percentage entre 0 y 100 y redondea a dos decimales', () => {
    const response = presentAffinityVector(
      buildVector({
        areas: [
          {
            areaId: RADAR_AREA_IDS['software-development'],
            affinity: 140.456,
            previousAffinity: -3.2,
            weighting: 5,
            topKeywords: [
              { keyword: 'javascript', weight: 5, frequency: 3, points: 15, percentage: 37.5 },
            ],
          },
        ],
      }),
    );

    expect(response.areas[0].affinity).toBe(100);
    expect(response.areas[0].previousAffinity).toBe(0);
  });

  it('no expone recalculated en GET y lo expone en POST', () => {
    const vector = buildVector({ recalculated: true });
    const get = presentAffinityVector(vector);
    const post = presentAffinityVector(vector, { includeRecalculated: true });

    expect(get).not.toHaveProperty('recalculated');
    expect(post.recalculated).toBe(true);
    expect(post.processingMs).toBe(13);
    expect(post.calculatedAt).toBe('2026-10-22T12:00:00.000Z');
    expect(post.unmappedKeywords).toEqual(['xylophone']);
  });

  it('usa false para recalculated cuando el vector no lo informa', () => {
    const response = presentAffinityVector(buildVector(), { includeRecalculated: true });

    expect(response.recalculated).toBe(false);
  });
});
