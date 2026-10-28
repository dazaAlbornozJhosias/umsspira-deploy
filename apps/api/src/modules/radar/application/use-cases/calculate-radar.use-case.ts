import { calculateAffinity } from '../../domain/affinity-calculator';
import type {
  AffinityCalculation,
  KeywordAreaWeight,
} from '../../domain/entities/affinity-calculation';
import type { ExtractedKeyword } from '../../../nlp/domain/entities/extracted-keyword';
import type { RadarRepositoryPort } from '../ports/radar-repository.port';

export interface CalculateRadarInput {
  graduateId: string;
  inputHash: string;
  keywords: readonly ExtractedKeyword[];
  areaWeights: readonly KeywordAreaWeight[];
  unmapped?: ExtractedKeyword[];
  calculatedAt?: Date;
}

export class CalculateRadarUseCase {
  constructor(private readonly radarRepository: RadarRepositoryPort) {}

  async execute(input: CalculateRadarInput): Promise<AffinityCalculation> {
    const calculation: AffinityCalculation = {
      graduateId: input.graduateId,
      inputHash: input.inputHash,
      calculatedAt: input.calculatedAt ?? new Date(),
      areas: calculateAffinity(input.keywords, input.areaWeights),
      unmapped: input.unmapped ?? [],
    };

    await this.radarRepository.saveCalculation(calculation as never);
    return calculation;
  }
}
