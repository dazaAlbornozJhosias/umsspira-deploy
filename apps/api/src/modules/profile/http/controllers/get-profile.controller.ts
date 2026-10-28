import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { presentProfile } from '../presenters/profile.presenter';

@Controller('perfil')
export class GetProfileController {
  constructor(private readonly useCase: GetProfileUseCase) {}

  @Get('')
  @RequirePermissions('perfil:self:read')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentProfile(await this.useCase.execute(actor)) };
  }
}
