import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UploadedFileData } from '../../../../shared/files/contracts/uploaded-file';
import { MAX_IMAGE_BYTES } from '../../../../shared/files/policies/image-file.policy';
import { UploadCertificationBackupUseCase } from '../../application/use-cases/upload-certification-backup.use-case';
import { profileIdSchema } from '../schemas/profile.schemas';
import { presentBackup } from '../presenters/profile.presenter';

@Controller('perfil')
export class UploadCertificationBackupController {
  constructor(private readonly useCase: UploadCertificationBackupUseCase) {}

  @Post('certificaciones/:id/respaldo')
  @RequirePermissions('perfil:self:write')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 } }),
  )
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
    @UploadedFile() file?: UploadedFileData,
  ) {
    return { data: presentBackup(await this.useCase.execute(actor, id, file)) };
  }
}
