import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMyMentorProfileUseCase } from '../../application/use-cases/get-my-mentor-profile.use-case';
import { presentMentor } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMyMentorProfileController {
  constructor(private readonly useCase: GetMyMentorProfileUseCase) {}
  @Get('my-profile')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentMentor(await this.useCase.execute(actor)) };
  }
}
