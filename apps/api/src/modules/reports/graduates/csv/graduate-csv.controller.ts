import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  GRADUATE_REPORT_DATA_SOURCE,
  GraduateReportDataSource,
  GraduateReportStatus,
} from './data/graduate-report-data-source';
import { GraduateCsvService } from './graduate-csv.service';

interface CsvHttpResponse {
  setHeader(name: string, value: string): void;
}

@Controller('graduates-report')
export class GraduateCsvController {
  constructor(
    @Inject(GRADUATE_REPORT_DATA_SOURCE)
    private readonly dataSource: GraduateReportDataSource,
    private readonly csvService: GraduateCsvService,
  ) {}

  @Get('csv')
  exportCsv(
    @Query('status') status: string | undefined,
    @Query('career') career: string | undefined,
    @Query('search') search: string | undefined,
    @Res({ passthrough: true }) response: CsvHttpResponse,
  ): StreamableFile {
    try {
      const normalizedStatus = this.parseStatus(status);
      const records = this.dataSource.findAll({
        status: normalizedStatus,
        career,
        search,
      });
      const file = this.csvService.generate(
        records,
        new Date(),
        normalizedStatus,
      );

      response.setHeader('Content-Type', 'text/csv; charset=utf-8');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.filename}"`,
      );

      return new StreamableFile(file.buffer);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'No se pudo generar el archivo CSV. Intente nuevamente.',
      );
    }
  }

  private parseStatus(status: string | undefined): GraduateReportStatus | undefined {
    if (!status || status.toUpperCase() === 'TODOS') {
      return undefined;
    }

    const normalizedStatus = status.toUpperCase();

    if (
      normalizedStatus !== 'VERIFICADO' &&
      normalizedStatus !== 'OBSERVADO'
    ) {
      throw new BadRequestException('Estado de exportación inválido');
    }

    return normalizedStatus;
  }
}
