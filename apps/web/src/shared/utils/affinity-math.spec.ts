import { calculateAffinityVariation, sortAreasByAffinityDesc } from './affinity-math';
import type { AffinityAreaScore } from '@umsspira/shared-types';

describe('Affinity Math', () => {
  it('calcula la variacion correctamente', () => {
    expect(calculateAffinityVariation(80, 70)).toBe('+10%');
  });
});

describe('sortAreasByAffinityDesc', () => {
  it('ordena las áreas de mayor a menor afinidad', () => {
    const areas: AffinityAreaScore[] = [
      { area: 'software-development', affinity: 50 },
      { area: 'data-ai', affinity: 80 },
      { area: 'cloud-devops', affinity: 20 }
    ];
    const sorted = sortAreasByAffinityDesc(areas);
    expect(sorted[0].area).toBe('data-ai');
    expect(sorted[2].area).toBe('cloud-devops');
  });
});

describe('calculateAffinityVariation', () => {
  it('retorna undefined si no hay valor previo (undefined)', () => {
    const variation = calculateAffinityVariation(50, undefined);
    expect(variation).toBeUndefined();
  });

  it('retorna undefined si la diferencia entre ambos valores es nula', () => {
    const variation = calculateAffinityVariation(50, 50);
    expect(variation).toBeUndefined();
  });
});