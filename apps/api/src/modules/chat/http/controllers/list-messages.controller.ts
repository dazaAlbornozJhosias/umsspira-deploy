import { Controller, Get, Param, Query } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ListMessagesUseCase } from '../../application/use-cases/list-messages.use-case';
import { conversationIdSchema, historySchema } from '../schemas/chat.schemas';
import { presentMessage } from '../presenters/chat.presenter';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class ListMessagesController {
  constructor(private readonly useCase: ListMessagesUseCase) {}
  @Get(':id/messages')
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Query(new ZodValidationPipe(historySchema)) query: z.output<typeof historySchema>,
  ) {
    const result = await this.useCase.execute(actor.id, id, query.before);
    return { data: { items: result.items.map(presentMessage), nextCursor: result.nextCursor } };
  }
}
