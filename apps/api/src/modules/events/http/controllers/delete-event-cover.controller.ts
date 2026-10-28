import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { DeleteEventCoverUseCase } from '../../application/use-cases/delete-event-cover.use-case';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class DeleteEventCoverController {
  constructor(private readonly useCase: DeleteEventCoverUseCase) {}

  @Delete('covers/:id')
  @HttpCode(204)
  @RequirePermissions('eventos:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
  ): Promise<void> {
    await this.useCase.execute(actor, id);
  }
}
