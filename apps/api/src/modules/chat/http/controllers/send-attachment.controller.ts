import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UploadedFileData } from '../../../../shared/files/contracts/uploaded-file';
import { SendAttachmentUseCase } from '../../application/use-cases/send-attachment.use-case';
import { MAX_ATTACHMENT_BYTES } from '../../domain/policies/attachment.policy';
import { conversationIdSchema } from '../schemas/chat.schemas';
import { presentMessage } from '../presenters/chat.presenter';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';

const uploadSchema = z.strictObject({
  clientId: z.uuid(),
  content: z.string().trim().max(500).default(''),
});
@Controller('chat/conversations')
@RequirePermissions('user:self:read')
export class SendAttachmentController {
  constructor(private readonly useCase: SendAttachmentUseCase) {}
  @Post(':id/attachments')
  @UseGuards(ChatRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1, fields: 2, fieldSize: 4096 },
    }),
  )
  async execute(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Body(new ZodValidationPipe(uploadSchema)) body: z.output<typeof uploadSchema>,
    @UploadedFile() file?: UploadedFileData,
  ) {
    return {
      data: presentMessage(
        await this.useCase.execute(
          actor.id,
          id,
          body,
          file ? { name: file.originalname, bytes: file.buffer } : undefined,
        ),
      ),
    };
  }
}
