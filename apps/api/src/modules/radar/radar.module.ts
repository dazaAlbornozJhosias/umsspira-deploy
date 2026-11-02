import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { NlpModule } from '../nlp/nlp.module';
import { KEYWORD_EXTRACTOR_PORT } from './application/ports/keyword-extractor.port';
import { PROFILE_TEXT_READER_PORT } from './application/ports/profile-text-reader.port';
import {
  RADAR_REPOSITORY_PORT,
  type RadarRepositoryPort,
} from './application/ports/radar-repository.port';
import { CalculateRadarUseCase } from './application/use-cases/calculate-radar.use-case';
import { GetRadarUseCase } from './application/use-cases/get-radar.use-case';
import { RecalculateRadarUseCase } from './application/use-cases/recalculate-radar.use-case';
import { GetRadarController } from './http/controllers/get-radar.controller';
import { RecalculateRadarController } from './http/controllers/recalculate-radar.controller';
import { NlpKeywordExtractorAdapter } from './infrastructure/adapters/nlp-keyword-extractor.adapter';
import { PrismaProfileTextReaderAdapter } from './infrastructure/adapters/prisma-profile-text-reader.adapter';
import { PrismaRadarRepository } from './infrastructure/repositories/prisma-radar.repository';

@Module({
  imports: [PrismaModule, NlpModule],
  controllers: [GetRadarController, RecalculateRadarController],
  providers: [
    PrismaRadarRepository,
    { provide: RADAR_REPOSITORY_PORT, useExisting: PrismaRadarRepository },
    PrismaProfileTextReaderAdapter,
    { provide: PROFILE_TEXT_READER_PORT, useExisting: PrismaProfileTextReaderAdapter },
    NlpKeywordExtractorAdapter,
    { provide: KEYWORD_EXTRACTOR_PORT, useExisting: NlpKeywordExtractorAdapter },
    {
      provide: CalculateRadarUseCase,
      inject: [RADAR_REPOSITORY_PORT],
      useFactory: (repository: RadarRepositoryPort) => new CalculateRadarUseCase(repository),
    },
    RecalculateRadarUseCase,
    GetRadarUseCase,
  ],
  exports: [RADAR_REPOSITORY_PORT, CalculateRadarUseCase],
})
export class RadarModule {}
