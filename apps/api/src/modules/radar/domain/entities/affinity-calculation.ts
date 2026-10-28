import type { ExtractedKeyword } from '../../../nlp/domain/entities/extracted-keyword';
import type { RadarArea } from './radar-area';

export interface KeywordAreaWeight {
  term: string;
  area: RadarArea;
  weight: number;
}

export interface RadarAreaAffinity {
  area: RadarArea;
  score: number;
  percentage: number;
  weighting: number | null;
  topKeywords: Array<{ term: string; contribution: number }>;
}

export interface AffinityCalculation {
  graduateId: string;
  inputHash: string;
  calculatedAt: Date;
  areas: RadarAreaAffinity[];
  unmapped: ExtractedKeyword[];
}
