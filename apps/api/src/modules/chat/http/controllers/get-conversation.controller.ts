import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetConversationUseCase } from '../../application/use-cases/get-conversation.use-case';
import { conversationIdSchema } from '../schemas/chat.schemas';
import { presentSummary } from '../presenters/chat.presenter';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class GetConversationController {
  constructor(private readonly useCase: GetConversationUseCase) {}
  @Get(':id')
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
  ) {
    return { data: presentSummary(await this.useCase.execute(actor.id, id)) };
  }
}
