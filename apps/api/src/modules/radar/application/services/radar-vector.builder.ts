import { normalizeTopKeywords } from '../../domain/policies/affinity-calculator';
import type { RadarVector, RadarAreaVector } from '../contracts/radar-vector';
import type { RadarCalculationSnapshot } from '../ports/radar-repository.port';

export interface BuildRadarVectorInput {
  calculation: RadarCalculationSnapshot;
  previous: RadarCalculationSnapshot | null;
  hasLaborHistory: boolean;
  hasPendingChanges: boolean;
  recalculated?: boolean;
  processingMs: number;
  unmappedKeywords: readonly string[];
}

function getMaxWeight(keywords: readonly { weight: number }[]): number | null {
  if (keywords.length === 0) {
    return null;
  }

  return Math.max(...keywords.map(({ weight }) => weight));
}

function buildAreas(
  calculation: RadarCalculationSnapshot,
  previous: RadarCalculationSnapshot | null,
): RadarAreaVector[] {
  return calculation.afinidad.map((area) => {
    const topKeywords = normalizeTopKeywords(area.palabrasClaveTop);
    const previousArea = previous?.afinidad.find((candidate) => candidate.areaId === area.areaId);

    return {
      areaId: area.areaId,
      affinity: area.porcentaje,
      previousAffinity: previousArea === undefined ? null : previousArea.porcentaje,
      // La tabla afinidad_radar no guarda ponderacion. Para las filas históricas se deriva
      // del mayor peso conservado en la instantánea de palabras clave.
      weighting: area.ponderacion ?? getMaxWeight(topKeywords),
      topKeywords,
    };
  });
}

/** Arma el vector interno a partir de las instantáneas persistidas y sus metadatos. */
export function buildRadarVector(input: BuildRadarVectorInput): RadarVector {
  const { calculation, previous } = input;

  return {
    graduateId: calculation.tituladoId,
    hasLaborHistory: input.hasLaborHistory,
    calculatedAt: calculation.fechaCalculo,
    status: calculation.estado === 'VACIO' ? 'empty' : 'ok',
    algorithmVersion: calculation.versionAlgoritmo,
    hasPendingChanges: input.hasPendingChanges,
    ...(input.recalculated === undefined ? {} : { recalculated: input.recalculated }),
    processingMs: input.processingMs,
    areas: buildAreas(calculation, previous),
    unmappedKeywords: [...new Set(input.unmappedKeywords)],
  };
}
