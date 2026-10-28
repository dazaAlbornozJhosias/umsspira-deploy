import { Controller, Post, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { createEventSchema } from '../schemas/events.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { CreateEventInput } from '../../application/contracts/event-inputs';

@Controller('events')
export class CreateEventController {
  constructor(private readonly useCase: CreateEventUseCase) {}

  @Post('')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createEventSchema)) body: CreateEventInput,
  ) {
    return { data: presentEvent(await this.useCase.execute(actor, body)) };
  }
}
