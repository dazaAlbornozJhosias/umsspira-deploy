import { Controller, Patch, Body, Param, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { EditMessageUseCase } from '../../application/use-cases/edit-message.use-case';
import { conversationIdSchema, messageIdSchema, editMessageSchema } from '../schemas/chat.schemas';
import { presentMessage } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class EditMessageController {
  constructor(private readonly useCase: EditMessageUseCase) {}
  @Patch(':id/messages/:messageId')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Param('messageId', new ZodValidationPipe(messageIdSchema)) messageId: string,
    @Body(new ZodValidationPipe(editMessageSchema)) body: z.output<typeof editMessageSchema>,
  ) {
    return {
      data: presentMessage(await this.useCase.execute(actor.id, id, messageId, body.content)),
    };
  }
}
