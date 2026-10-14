import { Module } from '@nestjs/common';
import { GraduatesReportController } from './graduates-report.controller';
import { GraduatesReportRepository } from './graduates-report.repository';
import { GraduatesReportService } from './graduates-report.service';

// Reporte de titulados verificados u observados (HU4): consulta y exportación a PDF.
@Module({
  controllers: [GraduatesReportController],
  providers: [GraduatesReportService, GraduatesReportRepository],
  exports: [GraduatesReportService],
})
export class GraduatesReportModule {}
