import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { z } from 'zod';
import { ListReportGraduatesUseCase } from '../../application/use-cases/list-report-graduates.use-case';
import { graduateListSchema } from '../schemas/reports.schemas';
import { presentGraduatePage } from '../presenters/report.presenter';

@Controller('reports')
@Roles('administrador')
export class ListReportGraduatesController {
  constructor(private readonly useCase: ListReportGraduatesUseCase) {}

  @Get('graduates')
  @RequirePermissions('reportes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(graduateListSchema)) query: z.infer<typeof graduateListSchema>,
  ) {
    return { data: presentGraduatePage(await this.useCase.execute(actor, query)) };
  }
}
