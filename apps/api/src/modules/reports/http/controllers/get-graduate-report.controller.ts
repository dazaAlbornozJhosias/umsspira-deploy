import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { z } from 'zod';
import { GetGraduateReportUseCase } from '../../application/use-cases/get-graduate-report.use-case';
import { reportFilterSchema } from '../schemas/reports.schemas';
import { presentReport } from '../presenters/report.presenter';

@Controller('reports')
@Roles('administrador')
export class GetGraduateReportController {
  constructor(private readonly useCase: GetGraduateReportUseCase) {}

  @Get('graduates/report')
  @RequirePermissions('reportes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(reportFilterSchema)) query: z.infer<typeof reportFilterSchema>,
  ) {
    return { data: presentReport(await this.useCase.execute(actor, query)) };
  }
}
