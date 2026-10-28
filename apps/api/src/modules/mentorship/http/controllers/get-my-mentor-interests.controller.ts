import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMyMentorInterestsUseCase } from '../../application/use-cases/get-my-mentor-interests.use-case';
import { presentInterest } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMyMentorInterestsController {
  constructor(private readonly useCase: GetMyMentorInterestsUseCase) {}
  @Get('interests/mine')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: (await this.useCase.execute(actor)).map(presentInterest) };
  }
}
