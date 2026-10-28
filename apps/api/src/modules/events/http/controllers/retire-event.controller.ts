import { Controller, Param, Patch } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';

import { RetireEventUseCase } from '../../application/use-cases/retire-event.use-case';
import { presentRetiredEvent } from '../presenters/event.presenter';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class RetireEventController {
  constructor(private readonly useCase: RetireEventUseCase) {}

  @Patch('owned/:id/retire')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    return { data: presentRetiredEvent(await this.useCase.execute(actor, id)) };
  }
}
