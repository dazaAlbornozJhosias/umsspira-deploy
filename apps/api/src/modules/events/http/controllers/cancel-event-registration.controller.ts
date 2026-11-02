import { Controller, HttpCode, Param, Patch } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CancelEventRegistrationUseCase } from '../../application/use-cases/cancel-event-registration.use-case';
import { registrationIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class CancelEventRegistrationController {
  constructor(private readonly useCase: CancelEventRegistrationUseCase) {}

  @Patch('registrations/:registrationId/cancel')
  @HttpCode(204)
  @Roles('titulado')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('registrationId', new ZodValidationPipe(registrationIdSchema)) registrationId: string,
  ): Promise<void> {
    await this.useCase.execute(actor, registrationId);
  }
}
