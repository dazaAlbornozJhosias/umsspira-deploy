import { Controller, Post, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateEducationUseCase } from '../../application/use-cases/create-education.use-case';
import { presentProfileRecord } from '../presenters/profile.presenter';
import { educationSchema } from '../schemas/profile.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { EducationInput } from '../../application/contracts/profile-inputs';

@Controller('perfil')
export class CreateEducationController {
  constructor(private readonly useCase: CreateEducationUseCase) {}

  @Post('formacion-academica')
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(educationSchema)) body: EducationInput,
  ) {
    return { data: presentProfileRecord(await this.useCase.execute(actor, body)) };
  }
}
