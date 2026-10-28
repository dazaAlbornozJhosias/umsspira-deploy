import { Controller, Post, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateExperienceUseCase } from '../../application/use-cases/create-experience.use-case';
import { presentProfileRecord } from '../presenters/profile.presenter';
import { experienceSchema } from '../schemas/profile.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ExperienceInput } from '../../application/contracts/profile-inputs';

@Controller('perfil')
export class CreateExperienceController {
  constructor(private readonly useCase: CreateExperienceUseCase) {}

  @Post('experiencia-laboral')
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(experienceSchema)) body: ExperienceInput,
  ) {
    return { data: presentProfileRecord(await this.useCase.execute(actor, body)) };
  }
}
