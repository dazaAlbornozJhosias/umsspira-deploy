import { Controller, Put, Body, Param, UseGuards } from '@nestjs/common';
import type { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { MarkReadUseCase } from '../../application/use-cases/mark-read.use-case';
import { conversationIdSchema, readSchema } from '../schemas/chat.schemas';

import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class MarkReadController {
  constructor(private readonly useCase: MarkReadUseCase) {}
  @Put(':id/read-receipt')
  @UseGuards(ChatRateLimitGuard)
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Body(new ZodValidationPipe(readSchema)) body: z.output<typeof readSchema>,
  ) {
    await this.useCase.execute(actor.id, id, body.messageId);
    return { data: { read: true } };
  }
}
