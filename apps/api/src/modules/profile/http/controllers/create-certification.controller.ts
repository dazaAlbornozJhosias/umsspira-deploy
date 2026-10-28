import { Controller, Post, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateCertificationUseCase } from '../../application/use-cases/create-certification.use-case';
import { presentProfileRecord } from '../presenters/profile.presenter';
import { createCertificationSchema } from '../schemas/profile.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { CertificationInput } from '../../application/contracts/profile-inputs';

@Controller('perfil')
export class CreateCertificationController {
  constructor(private readonly useCase: CreateCertificationUseCase) {}

  @Post('certificaciones')
  @RequirePermissions('perfil:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createCertificationSchema)) body: CertificationInput,
  ) {
    return { data: presentProfileRecord(await this.useCase.execute(actor, body)) };
  }
}
