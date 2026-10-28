import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { RADAR_REPOSITORY_PORT } from './application/ports/radar-repository.port';
import { CalculateRadarUseCase } from './application/use-cases/calculate-radar.use-case';
import { PrismaRadarRepository } from './infrastructure/repositories/prisma-radar.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaRadarRepository,
    { provide: RADAR_REPOSITORY_PORT, useExisting: PrismaRadarRepository },
    {
      provide: CalculateRadarUseCase,
      inject: [RADAR_REPOSITORY_PORT],
      useFactory: (repository: PrismaRadarRepository) => new CalculateRadarUseCase(repository),
    },
  ],
  exports: [RADAR_REPOSITORY_PORT, CalculateRadarUseCase],
})
export class RadarModule {}
