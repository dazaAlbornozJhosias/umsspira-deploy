import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileSection } from '../../domain/entities/profile-record';
import { DeleteProfileRecordUseCase } from '../../application/use-cases/delete-profile-record.use-case';
import { profileSectionSchema, profileIdSchema } from '../schemas/profile.schemas';

@Controller('perfil')
export class DeleteProfileRecordController {
  constructor(private readonly useCase: DeleteProfileRecordUseCase) {}

  @Delete(':section/:id')
  @HttpCode(204)
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('section', new ZodValidationPipe(profileSectionSchema)) section: ProfileSection,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
  ): Promise<void> {
    await this.useCase.execute(actor, section, id);
  }
}
