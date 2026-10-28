import { Controller, Patch, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { PublishEventDraftUseCase } from '../../application/use-cases/publish-event-draft.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { eventIdSchema } from '../schemas/events.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';

@Controller('events')
export class PublishEventDraftController {
  constructor(private readonly useCase: PublishEventDraftUseCase) {}

  @Patch('drafts/:id/publish')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    return { data: presentEvent(await this.useCase.execute(actor, id)) };
  }
}
