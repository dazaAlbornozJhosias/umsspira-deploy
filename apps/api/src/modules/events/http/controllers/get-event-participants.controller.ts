import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetEventParticipantsUseCase } from '../../application/use-cases/get-event-participants.use-case';
import { presentEventParticipants } from '../presenters/event-participants.presenter';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class GetEventParticipantsController {
  constructor(private readonly useCase: GetEventParticipantsUseCase) {}

  @Get('owned/:id/participants')
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ) {
    return { data: presentEventParticipants(await this.useCase.execute(actor, id)) };
  }
}