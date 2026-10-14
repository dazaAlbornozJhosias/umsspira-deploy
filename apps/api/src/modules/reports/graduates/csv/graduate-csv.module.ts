import { Module } from '@nestjs/common';
import { GRADUATE_REPORT_DATA_SOURCE } from './data/graduate-report-data-source';
import { MockGraduateReportDataSource } from './data/mock-graduate-report-data-source.service';
import { GraduateCsvController } from './graduate-csv.controller';
import { GraduateCsvService } from './graduate-csv.service';

@Module({
  controllers: [GraduateCsvController],
  providers: [
    GraduateCsvService,
    MockGraduateReportDataSource,
    {
      provide: GRADUATE_REPORT_DATA_SOURCE,
      useExisting: MockGraduateReportDataSource,
    },
  ],
  exports: [GraduateCsvService],
})
export class GraduateCsvModule {}
