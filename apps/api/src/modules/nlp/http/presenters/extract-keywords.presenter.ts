import type { ExtractionResult } from '../../domain/entities/extracted-keyword';

export function presentExtractedKeywords(result: ExtractionResult): ExtractionResult {
  return {
    keywords: result.keywords,
    unmapped: result.unmapped,
  };
}
