import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { conversationIdSchema, messageSchema } from '../schemas/chat.schemas';
import { presentMessage } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class SendMessageController {
  constructor(private readonly useCase: SendMessageUseCase) {}
  @Post(':id/messages')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Body(new ZodValidationPipe(messageSchema)) body: z.output<typeof messageSchema>,
  ) {
    return { data: presentMessage(await this.useCase.execute(actor.id, id, body)) };
  }
}
