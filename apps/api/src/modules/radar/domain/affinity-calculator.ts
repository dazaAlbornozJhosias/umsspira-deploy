import type { ExtractedKeyword } from '../../nlp/domain/entities/extracted-keyword';
import {
  AFFINITY_PERCENTAGE_FACTOR,
  MAX_AFFINITY_SCORE,
  MAX_KEYWORD_FREQUENCY,
  RADAR_AREAS,
  TOP_KEYWORDS_LIMIT,
} from './affinity-config';
import type { KeywordAreaWeight, RadarAreaAffinity } from './entities/affinity-calculation';

/**
 * Calcula cada eje independientemente. areaWeights contiene el catálogo completo
 * para que el porcentaje mida cobertura sobre el máximo posible del área.
 */
export function calculateAffinity(
  keywords: readonly ExtractedKeyword[],
  areaWeights: readonly KeywordAreaWeight[],
): RadarAreaAffinity[] {
  const frequencyByTerm = new Map<string, number>();
  for (const keyword of keywords) {
    if (!Number.isFinite(keyword.count) || keyword.count <= 0) {
      continue;
    }
    frequencyByTerm.set(keyword.term, Math.min(keyword.count, MAX_KEYWORD_FREQUENCY));
  }

  return RADAR_AREAS.map((area) => {
    const mappings = areaWeights.filter((mapping) => mapping.area === area);
    const contributions = mappings
      .map((mapping) => ({
        term: mapping.term,
        weight: mapping.weight,
        contribution: (frequencyByTerm.get(mapping.term) ?? 0) * mapping.weight,
      }))
      .filter(({ contribution }) => contribution > 0)
      .sort((a, b) => b.contribution - a.contribution || a.term.localeCompare(b.term));
    const rawScore = contributions.reduce((sum, item) => sum + item.contribution, 0);
    const maximumPossibleScore = mappings.reduce(
      (sum, mapping) => sum + mapping.weight * MAX_KEYWORD_FREQUENCY,
      0,
    );
    const score = Math.min(MAX_AFFINITY_SCORE, rawScore);
    const rawPercentage =
      maximumPossibleScore === 0
        ? 0
        : Math.min(MAX_AFFINITY_SCORE, (rawScore / maximumPossibleScore) * MAX_AFFINITY_SCORE);
    const percentage =
      Math.round((rawPercentage + Number.EPSILON) * AFFINITY_PERCENTAGE_FACTOR) /
      AFFINITY_PERCENTAGE_FACTOR;

    return {
      area,
      score,
      percentage,
      weighting:
        contributions.length > 0 ? Math.max(...contributions.map(({ weight }) => weight)) : null,
      topKeywords: contributions.slice(0, TOP_KEYWORDS_LIMIT).map(({ term, contribution }) => ({
        term,
        contribution,
      })),
    };
  });
}
