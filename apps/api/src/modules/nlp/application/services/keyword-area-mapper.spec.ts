import { RADAR_AREA_IDS } from '@umsspira/shared-types';
import { mapKeywordsToAreas } from './keyword-area-mapper';
import type { DictionaryAreaAssociation } from '../../domain/entities/dictionary-entry';

describe('mapKeywordsToAreas', () => {
  it('mapea una keyword a su área conservando el peso', () => {
    const associations = new Map<string, DictionaryAreaAssociation[]>([
      [
        'javascript',
        [
          {
            id: RADAR_AREA_IDS['software-development'],
            nombre: 'Desarrollo de Software',
            peso: 4,
          },
        ],
      ],
    ]);

    expect(mapKeywordsToAreas([{ term: 'javascript', count: 2 }], associations)).toEqual([
      {
        term: 'javascript',
        area: 'software-development',
        weight: 4,
      },
    ]);
  });

  it('conserva el peso completo en cada área sin dividirlo', () => {
    const associations = new Map<string, DictionaryAreaAssociation[]>([
      [
        'javascript',
        [
          {
            id: RADAR_AREA_IDS['software-development'],
            nombre: 'Desarrollo de Software',
            peso: 4,
          },
          {
            id: RADAR_AREA_IDS['data-ai'],
            nombre: 'Datos e IA',
            peso: 2,
          },
        ],
      ],
    ]);

    const result = mapKeywordsToAreas([{ term: 'javascript', count: 3 }], associations);

    expect(result).toHaveLength(2);

    expect(result).toEqual([
      {
        term: 'javascript',
        area: 'software-development',
        weight: 4,
      },
      {
        term: 'javascript',
        area: 'data-ai',
        weight: 2,
      },
    ]);

    expect(result.map(({ weight }) => weight)).toEqual([4, 2]);
    expect(result.every(({ term }) => term === 'javascript')).toBe(true);
  });

  it('devuelve una lista vacía si la keyword no tiene asociaciones', () => {
    expect(mapKeywordsToAreas([{ term: 'desconocida', count: 1 }], new Map())).toEqual([]);
  });

  it('falla explícitamente si encuentra un identificador de área desconocido', () => {
    const associations = new Map<string, DictionaryAreaAssociation[]>([
      [
        'javascript',
        [
          {
            id: 'uuid-desconocido',
            nombre: 'Área desconocida',
            peso: 4,
          },
        ],
      ],
    ]);

    expect(() => mapKeywordsToAreas([{ term: 'javascript', count: 1 }], associations)).toThrow(
      'UUID de área no reconocido: uuid-desconocido',
    );
  });
});
