import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ExportReportCsvUseCase } from '../../application/use-cases/export-report-csv.use-case';
import { reportFilterSchema } from '../schemas/reports.schemas';
import { ReportExportGuard } from '../guards/report-export.guard';

@Controller('reports')
@Roles('administrador')
export class ExportReportCsvController {
  constructor(private readonly useCase: ExportReportCsvUseCase) {}

  @Get('graduates/csv')
  @RequirePermissions('reportes:read')
  @UseGuards(ReportExportGuard)
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(reportFilterSchema)) query: z.infer<typeof reportFilterSchema>,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.useCase.execute(actor, query);
    response.type(file.mime).setHeader('Content-Length', String(file.bytes.length));
    response.setHeader('Content-Disposition', 'attachment; filename="' + file.name + '"');
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(file.bytes);
  }
}
