import { Controller, Param, Post } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RegisterEventUseCase } from '../../application/use-cases/register-event.use-case';
import { presentEventRegistration } from '../presenters/event-registration.presenter';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class RegisterEventController {
  constructor(private readonly useCase: RegisterEventUseCase) {}

  @Post(':id/registrations')
  @Roles('titulado')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    return { data: presentEventRegistration(await this.useCase.execute(actor, id)) };
  }
}
