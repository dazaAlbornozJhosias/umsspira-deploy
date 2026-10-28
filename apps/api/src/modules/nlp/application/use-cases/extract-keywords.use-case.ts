import type { ExtractionResult } from '../../domain/entities/extracted-keyword';
import { KeywordDictionaryLoader } from '../services/keyword-dictionary-loader';
import { KeywordExtractorService } from '../services/keyword-extractor.service';

export class ExtractKeywordsUseCase {
  constructor(
    private readonly dictionary: KeywordDictionaryLoader,
    private readonly extractor: KeywordExtractorService,
  ) {}

  async execute(text: string): Promise<ExtractionResult> {
    await this.dictionary.ensureLoaded();

    return this.extractor.extract(text);
  }
}
