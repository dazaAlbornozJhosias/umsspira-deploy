import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetGraduatesQueryDto } from './dto/get-graduates-query.dto';

@Controller(['api/reports', 'reports'])
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Mapea metrics, indicators y la ruta anidada dashboard/indicators de Taís
  @Get(['metrics', 'indicators', 'dashboard/indicators'])
  getMetrics() {
    return this.reportsService.getMetrics();
  }

  @Get('graduates')
  getGraduates(@Query() query: GetGraduatesQueryDto) {
    return this.reportsService.getGraduates(query);
  }
}