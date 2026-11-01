import { Controller, Get, Query } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ListConversationsUseCase } from '../../application/use-cases/list-conversations.use-case';
import { pageSchema } from '../schemas/chat.schemas';
import { presentSummary } from '../presenters/chat.presenter';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class ListConversationsController {
  constructor(private readonly useCase: ListConversationsUseCase) {}
  @Get('')
  async execute(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(pageSchema)) query: z.output<typeof pageSchema>,
  ) {
    const result = await this.useCase.execute(actor.id, query.page);
    return { data: { items: result.items.map(presentSummary), hasMore: result.hasMore } };
  }
}
