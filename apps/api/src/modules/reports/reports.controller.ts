import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetGraduatesQueryDto } from './dto/get-graduates-query.dto';

@Controller(['api/reports', 'reports'])
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(['metrics', 'indicators', 'dashboard/indicators'])
  async getMetrics() {
    return await this.reportsService.getMetrics();
  }

  @Get('graduates')
  async getGraduates(@Query() query: GetGraduatesQueryDto) {
    return await this.reportsService.getGraduates(query);
  }
}