import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetProfileRecordUseCase } from '../../application/use-cases/get-profile-record.use-case';
import { presentProfileRecord } from '../presenters/profile.presenter';
import { profileSectionSchema, profileIdSchema } from '../schemas/profile.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ProfileSection } from '../../domain/entities/profile-record';

@Controller('perfil')
export class GetProfileRecordController {
  constructor(private readonly useCase: GetProfileRecordUseCase) {}

  @Get(':section/:id')
  @RequirePermissions('perfil:self:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('section', new ZodValidationPipe(profileSectionSchema)) section: ProfileSection,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
  ) {
    return { data: presentProfileRecord(await this.useCase.execute(actor, section, id)) };
  }
}
