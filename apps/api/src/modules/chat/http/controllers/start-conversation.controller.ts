import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';
import { startConversationSchema } from '../schemas/chat.schemas';
import { presentConversation } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class StartConversationController {
  constructor(private readonly useCase: StartConversationUseCase) {}
  @Post('')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(startConversationSchema))
    body: z.output<typeof startConversationSchema>,
  ) {
    const result = await this.useCase.execute(actor.id, body.recipientId, body);
    return {
      data: { conversation: presentConversation(result.conversation), created: result.created },
    };
  }
}
