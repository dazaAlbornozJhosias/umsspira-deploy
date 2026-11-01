import { Controller, Patch, Body, Param, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RespondRequestUseCase } from '../../application/use-cases/respond-request.use-case';
import { conversationIdSchema, decisionSchema } from '../schemas/chat.schemas';
import { presentConversation } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class RespondRequestController {
  constructor(private readonly useCase: RespondRequestUseCase) {}
  @Patch(':id/request')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Body(new ZodValidationPipe(decisionSchema)) body: z.output<typeof decisionSchema>,
  ) {
    return { data: presentConversation(await this.useCase.execute(actor.id, id, body.decision)) };
  }
}
