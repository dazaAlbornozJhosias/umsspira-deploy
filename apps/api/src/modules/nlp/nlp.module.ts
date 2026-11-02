import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { KeywordDictionaryLoader } from './application/services/keyword-dictionary-loader';
import { KeywordExtractorService } from './application/services/keyword-extractor.service';
import { ExtractKeywordsController } from './http/controllers/extract-keywords.controller';
import { nlpProviders } from './infrastructure/providers/nlp.providers';
import { NlpDictionaryUnavailableFilter } from './http/filters/nlp-dictionary-unavailable.filter';

@Module({
  imports: [PrismaModule],
  controllers: [ExtractKeywordsController],
  providers: [...nlpProviders, NlpDictionaryUnavailableFilter],
  exports: [KeywordDictionaryLoader, KeywordExtractorService],
})
export class NlpModule {}
