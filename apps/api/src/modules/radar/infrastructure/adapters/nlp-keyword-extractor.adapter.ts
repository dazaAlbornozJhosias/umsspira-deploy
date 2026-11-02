import { Injectable } from '@nestjs/common';
import { KeywordDictionaryLoader } from '../../../nlp/application/services/keyword-dictionary-loader';
import { KeywordExtractorService } from '../../../nlp/application/services/keyword-extractor.service';
import { NlpDictionaryUnavailableError } from '../../../nlp/domain/errors/nlp-dictionary-unavailable-error';
import { KeywordDictionaryUnavailableError } from '../../domain/errors/keyword-dictionary-unavailable-error';
import {
  type ExtractedKeywordResult,
  type KeywordExtractorPort,
} from '../../application/ports/keyword-extractor.port';

/**
 * Adaptador del radar hacia el motor NLP. El dominio y los casos de uso solo
 * conocen KeywordExtractorPort; el acoplamiento con NLP queda en infraestructura.
 */
@Injectable()
export class NlpKeywordExtractorAdapter implements KeywordExtractorPort {
  constructor(
    private readonly dictionary: KeywordDictionaryLoader,
    private readonly extractor: KeywordExtractorService,
  ) {}

  async extractFromTexts(texts: string[]): Promise<ExtractedKeywordResult> {
    try {
      await this.dictionary.ensureLoaded();
    } catch (error) {
      if (error instanceof NlpDictionaryUnavailableError) {
        throw new KeywordDictionaryUnavailableError();
      }
      throw error;
    }

    // Una sola extracción con segmentos separados por salto de línea evita
    // cruzar n-gramas entre campos del perfil.
    const { keywords, unmapped } = this.extractor.extract(texts.join('\n'));

    return { keywords, unmapped };
  }
}
