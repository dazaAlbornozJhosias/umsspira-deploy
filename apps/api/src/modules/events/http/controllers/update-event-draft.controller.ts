import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { UpdateEventDraftUseCase } from '../../application/use-cases/update-event-draft.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { eventIdSchema, updateEventSchema } from '../schemas/events.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { EventInput } from '../../application/contracts/event-inputs';

@Controller('events')
export class UpdateEventDraftController {
  constructor(private readonly useCase: UpdateEventDraftUseCase) {}

  @Patch('drafts/:id')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) body: EventInput,
  ) {
    return { data: presentEvent(await this.useCase.execute(actor, id, body)) };
  }
}
