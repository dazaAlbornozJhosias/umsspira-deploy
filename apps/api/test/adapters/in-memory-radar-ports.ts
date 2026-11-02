import type {
  ProfileTextReaderPort,
  ProfileTextSources,
} from '../../src/modules/radar/application/ports/profile-text-reader.port';
import type {
  ExtractedKeywordResult,
  KeywordExtractorPort,
} from '../../src/modules/radar/application/ports/keyword-extractor.port';
import { KeywordDictionaryUnavailableError } from '../../src/modules/radar/domain/errors/keyword-dictionary-unavailable-error';

export class StubProfileTextReader implements ProfileTextReaderPort {
  texts: string[] = [];
  hasLaborHistory = true;
  calls = 0;

  reset(): void {
    this.texts = [];
    this.hasLaborHistory = true;
    this.calls = 0;
  }

  async getProfileTexts(tituladoId: string): Promise<ProfileTextSources> {
    this.calls += 1;

    return {
      tituladoId,
      texts: [...this.texts],
      hasLaborHistory: this.hasLaborHistory,
    };
  }
}

export class StubKeywordExtractor implements KeywordExtractorPort {
  keywords: Array<{ term: string; count: number }> = [];
  unmapped: Array<{ term: string; count: number }> = [];
  failWithDictionaryError = false;
  calls = 0;

  reset(): void {
    this.keywords = [];
    this.unmapped = [];
    this.failWithDictionaryError = false;
    this.calls = 0;
  }

  async extractFromTexts(_texts: string[]): Promise<ExtractedKeywordResult> {
    this.calls += 1;

    if (this.failWithDictionaryError) {
      throw new KeywordDictionaryUnavailableError();
    }

    return {
      keywords: this.keywords.map((keyword) => ({ ...keyword })),
      unmapped: this.unmapped.map((keyword) => ({ ...keyword })),
    };
  }
}
