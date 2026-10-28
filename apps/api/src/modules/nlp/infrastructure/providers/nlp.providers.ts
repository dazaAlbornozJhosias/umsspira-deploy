import type { Provider } from '@nestjs/common';
import {
  KEYWORD_DICTIONARY_PORT,
  type KeywordDictionaryPort,
} from '../../application/ports/keyword-dictionary.port';
import { KeywordDictionaryLoader } from '../../application/services/keyword-dictionary-loader';
import { KeywordExtractorService } from '../../application/services/keyword-extractor.service';
import { ExtractKeywordsUseCase } from '../../application/use-cases/extract-keywords.use-case';
import { PrismaKeywordDictionaryRepository } from '../repositories/prisma-keyword-dictionary.repository';

export const nlpProviders: Provider[] = [
  KeywordExtractorService,
  PrismaKeywordDictionaryRepository,
  { provide: KEYWORD_DICTIONARY_PORT, useExisting: PrismaKeywordDictionaryRepository },
  {
    provide: KeywordDictionaryLoader,
    inject: [KEYWORD_DICTIONARY_PORT, KeywordExtractorService],
    useFactory: (source: KeywordDictionaryPort, extractor: KeywordExtractorService) =>
      new KeywordDictionaryLoader(source, extractor),
  },
  {
    provide: ExtractKeywordsUseCase,
    inject: [KeywordDictionaryLoader, KeywordExtractorService],
    useFactory: (dictionary: KeywordDictionaryLoader, extractor: KeywordExtractorService) =>
      new ExtractKeywordsUseCase(dictionary, extractor),
  },
];
