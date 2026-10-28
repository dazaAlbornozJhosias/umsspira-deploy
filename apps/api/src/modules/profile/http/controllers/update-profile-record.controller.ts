import { Controller, Put, Body, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { UpdateProfileRecordUseCase } from '../../application/use-cases/update-profile-record.use-case';
import { presentProfileRecord } from '../presenters/profile.presenter';
import {
  profileSectionSchema,
  profileIdSchema,
  profileChangeSchema,
} from '../schemas/profile.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ProfileSection } from '../../domain/entities/profile-record';

@Controller('perfil')
export class UpdateProfileRecordController {
  constructor(private readonly useCase: UpdateProfileRecordUseCase) {}

  @Put(':section/:id')
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('section', new ZodValidationPipe(profileSectionSchema)) section: ProfileSection,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
    @Body() body: unknown,
  ) {
    return {
      data: presentProfileRecord(
        await this.useCase.execute(actor, id, profileChangeSchema.parse({ section, data: body })),
      ),
    };
  }
}
