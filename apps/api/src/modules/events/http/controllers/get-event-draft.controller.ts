import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { GetEventDraftUseCase } from '../../application/use-cases/get-event-draft.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { eventIdSchema } from '../schemas/events.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';

@Controller('events')
export class GetEventDraftController {
  constructor(private readonly useCase: GetEventDraftUseCase) {}

  @Get('drafts/:id')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    return { data: presentEvent(await this.useCase.execute(actor, id)) };
  }
}
