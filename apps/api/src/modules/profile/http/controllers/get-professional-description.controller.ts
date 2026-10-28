import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetProfessionalDescriptionUseCase } from '../../application/use-cases/get-professional-description.use-case';
import { presentDescription } from '../presenters/profile.presenter';

@Controller('perfil')
export class GetProfessionalDescriptionController {
  constructor(private readonly useCase: GetProfessionalDescriptionUseCase) {}

  @Get('descripcion-profesional')
  @RequirePermissions('perfil:self:read')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentDescription(await this.useCase.execute(actor)) };
  }
}
