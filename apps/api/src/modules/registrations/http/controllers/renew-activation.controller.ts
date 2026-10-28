import { Controller, Param, Post } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RenewActivationUseCase } from '../../application/use-cases/renew-activation.use-case';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('applications')
export class RenewActivationController {
  constructor(private readonly useCase: RenewActivationUseCase) {}

  @Post(':id/activation')
  @RequirePermissions('solicitudes:review')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
  ) {
    return { data: await this.useCase.execute(actor, id) };
  }
}
