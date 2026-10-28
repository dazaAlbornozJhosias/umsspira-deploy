import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UploadedFileData } from '../../../../shared/files/contracts/uploaded-file';
import { MAX_IMAGE_BYTES } from '../../../../shared/files/policies/image-file.policy';
import { UploadEventCoverUseCase } from '../../application/use-cases/upload-event-cover.use-case';

@Controller('events')
export class UploadEventCoverController {
  constructor(private readonly useCase: UploadEventCoverUseCase) {}

  @Post('covers')
  @RequirePermissions('eventos:manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 } }),
  )
  async handle(@CurrentActor() actor: ActorContext, @UploadedFile() file?: UploadedFileData) {
    const id = await this.useCase.execute(actor, file);
    return { data: { id, imageUrl: '/api/v1/events/covers/' + id } };
  }
}
