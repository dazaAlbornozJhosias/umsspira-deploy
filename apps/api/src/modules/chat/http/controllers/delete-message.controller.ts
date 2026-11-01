import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { DeleteMessageUseCase } from '../../application/use-cases/delete-message.use-case';
import { conversationIdSchema, messageIdSchema } from '../schemas/chat.schemas';
import { presentMessage } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class DeleteMessageController {
  constructor(private readonly useCase: DeleteMessageUseCase) {}
  @Delete(':id/messages/:messageId')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Param('messageId', new ZodValidationPipe(messageIdSchema)) messageId: string,
  ) {
    return { data: presentMessage(await this.useCase.execute(actor.id, id, messageId)) };
  }
}
