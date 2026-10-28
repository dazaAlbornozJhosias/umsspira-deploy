import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { z } from 'zod';
import { GetReportMetricsUseCase } from '../../application/use-cases/get-report-metrics.use-case';
import { reportMetricsSchema } from '../schemas/reports.schemas';
import { presentMetrics } from '../presenters/report.presenter';

@Controller('reports')
@Roles('administrador')
export class GetReportMetricsController {
  constructor(private readonly useCase: GetReportMetricsUseCase) {}

  @Get('metrics')
  @RequirePermissions('reportes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(reportMetricsSchema)) query: z.infer<typeof reportMetricsSchema>,
  ) {
    return { data: presentMetrics(await this.useCase.execute(actor, query.careerId)) };
  }
}
