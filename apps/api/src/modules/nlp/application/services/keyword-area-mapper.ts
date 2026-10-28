import { RADAR_AREA_IDS, type RadarArea } from '@umsspira/shared-types';
import type { DictionaryAreaAssociation } from '../../domain/entities/dictionary-entry';
import type { ExtractedKeyword } from '../../domain/entities/extracted-keyword';

export interface KeywordAreaWeight {
  term: string;
  area: RadarArea;
  weight: number;
}

const AREA_BY_ID = new Map<string, RadarArea>(
  Object.entries(RADAR_AREA_IDS).map(([area, id]) => [id, area as RadarArea]),
);

/**
 * Convierte las asociaciones del diccionario al formato del cálculo del radar.
 * Cada área conserva el peso completo de su asociación.
 */
export function mapKeywordsToAreas(
  keywords: readonly ExtractedKeyword[],
  areasByKeyword: ReadonlyMap<string, readonly DictionaryAreaAssociation[]>,
): KeywordAreaWeight[] {
  const result: KeywordAreaWeight[] = [];

  for (const keyword of keywords) {
    const associations = areasByKeyword.get(keyword.term) ?? [];

    for (const association of associations) {
      const area = AREA_BY_ID.get(association.id);

      if (!area) {
        throw new Error(`UUID de área no reconocido: ${association.id}`);
      }

      result.push({
        term: keyword.term,
        area,
        weight: association.peso,
      });
    }
  }

  return result;
}
