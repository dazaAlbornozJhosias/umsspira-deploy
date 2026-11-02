import { Module } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { VacantesController } from './vacantes.controller';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VacantesController],
  providers: [VacantesService],
})
export class VacantesModule {}