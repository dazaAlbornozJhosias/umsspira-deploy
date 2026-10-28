import { Module, type OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { KeywordDictionaryLoader } from './application/services/keyword-dictionary-loader';
import { ExtractKeywordsController } from './http/controllers/extract-keywords.controller';
import { nlpProviders } from './infrastructure/providers/nlp.providers';
import { NlpDictionaryUnavailableFilter } from './http/filters/nlp-dictionary-unavailable.filter';

@Module({
  imports: [PrismaModule],
  controllers: [ExtractKeywordsController],
  providers: [...nlpProviders, NlpDictionaryUnavailableFilter],
})
export class NlpModule implements OnModuleInit {
  constructor(private readonly dictionary: KeywordDictionaryLoader) {}

  onModuleInit(): void {
    void this.dictionary.warmUp();
  }
}
