import { Controller, Get, Query } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ListApplicationsUseCase } from '../../application/use-cases/list-applications.use-case';
import { applicationQuerySchema } from '../schemas/registrations.schemas';
import type { ApplicationQuery } from '../../application/contracts/registration-inputs';

@Controller('applications')
export class ListApplicationsController {
  constructor(private readonly useCase: ListApplicationsUseCase) {}

  @Get('')
  @RequirePermissions('solicitudes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(applicationQuerySchema)) query: ApplicationQuery,
  ) {
    return { data: await this.useCase.execute(actor, query) };
  }
}
