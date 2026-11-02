import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { DownloadAttachmentUseCase } from '../../application/use-cases/download-attachment.use-case';
import { conversationIdSchema, messageIdSchema } from '../schemas/chat.schemas';

@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class DownloadAttachmentController {
  constructor(private readonly useCase: DownloadAttachmentUseCase) {}
  @Get(':id/messages/:messageId/attachment')
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Param('messageId', new ZodValidationPipe(messageIdSchema)) messageId: string,
    @Res() response: Response,
  ) {
    const file = await this.useCase.execute(actor.id, id, messageId);
    response.setHeader('Content-Type', file.mime);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="documento"; filename*=UTF-8''${encodeURIComponent(file.name).replaceAll("'", '%27')}`,
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(Buffer.from(file.bytes));
  }
}
