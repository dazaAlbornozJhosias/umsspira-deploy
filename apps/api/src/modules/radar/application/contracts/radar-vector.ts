import type { KeywordContribution } from '../../domain/policies/affinity-calculator';

/** Área del vector tal como la entrega la capa de aplicación, todavía con el UUID del catálogo. */
export interface RadarAreaVector {
  areaId: string;
  affinity: number;
  previousAffinity: number | null;
  weighting: number | null;
  topKeywords: KeywordContribution[];
}

/** Resultado interno compartido por GET /radar y POST /radar/recalculate. */
export interface RadarVector {
  graduateId: string;
  hasLaborHistory: boolean;
  calculatedAt: Date;
  status: 'ok' | 'empty';
  algorithmVersion: string;
  hasPendingChanges: boolean;
  recalculated?: boolean;
  processingMs: number;
  areas: RadarAreaVector[];
  unmappedKeywords: string[];
}
