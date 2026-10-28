import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetApplicationUseCase } from '../../application/use-cases/get-application.use-case';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('applications')
export class GetApplicationController {
  constructor(private readonly useCase: GetApplicationUseCase) {}

  @Get(':id')
  @RequirePermissions('solicitudes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
  ) {
    return { data: await this.useCase.execute(actor, id) };
  }
}
