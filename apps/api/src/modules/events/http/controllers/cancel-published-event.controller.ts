import { Controller, Patch, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { CancelPublishedEventUseCase } from '../../application/use-cases/cancel-published-event.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class CancelPublishedEventController {
  constructor(private readonly useCase: CancelPublishedEventUseCase) {}

  @Patch(':id/cancel')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    const result = await this.useCase.execute(actor, id);
    return {
      data: {
        event: presentEvent(result.event),
        registrationsCount: result.registrationsCount,
        invalidatedPassesCount: result.invalidatedPassesCount,
      },
    };
  }
}
