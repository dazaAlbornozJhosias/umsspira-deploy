import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { GraduatesReportModule } from './graduates/pdf/graduates-report.module';
import { GraduateCsvModule } from './graduates/csv/graduate-csv.module';

@Module({
  imports: [GraduatesReportModule, GraduateCsvModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}