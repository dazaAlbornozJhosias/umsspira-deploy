import {
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Query,
  StreamableFile,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GraduatesReportQueryDto } from './dto/graduates-report-query.dto';
import { GraduatesReportService } from './graduates-report.service';
import { buildGraduatesReportPdf } from './document/graduates-report-pdf.builder';
import { GraduatesReportResponse } from './types/graduates-report.types';
import { buildReportFileName } from './utils/build-report-file-name';

@Controller('graduates-report')
// Valida los parámetros de consulta; un estado inválido responde 400
@UsePipes(new ValidationPipe({ transform: true }))
export class GraduatesReportController {
  constructor(private readonly graduatesReportService: GraduatesReportService) {}

  // GET /graduates-report?status=verified|observed: titulados de la carrera según su estado
  @Get()
  getGraduatesReport(@Query() query: GraduatesReportQueryDto): Promise<GraduatesReportResponse> {
    return this.graduatesReportService.getGraduatesReport(query.status, query.careerId);
  }

  // GET /graduates-report/pdf?status=verified|observed: el mismo reporte en PDF.
  // Sin titulados responde el 404 de la consulta; si falla el PDF, 500.
  @Get('pdf')
  // Deja que el navegador lea el nombre del archivo del PDF
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  async getGraduatesReportPdf(@Query() query: GraduatesReportQueryDto): Promise<StreamableFile> {
    const report = await this.graduatesReportService.getGraduatesReport(query.status, query.careerId);
    const fileName = buildReportFileName(report.status, new Date(report.generatedAt));

    let pdf: Buffer;
    try {
      pdf = await buildGraduatesReportPdf(report, fileName);
    } catch {
      throw new InternalServerErrorException('No se pudo generar el reporte PDF. Intente nuevamente.');
    }

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `inline; filename="${fileName}"`,
      length: pdf.length,
    });
  }
}
