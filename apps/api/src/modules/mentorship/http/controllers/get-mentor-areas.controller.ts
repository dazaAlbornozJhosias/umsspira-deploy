import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorAreasUseCase } from '../../application/use-cases/get-mentor-areas.use-case';
import { presentMentorAreas } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMentorAreasController {
  constructor(private readonly useCase: GetMentorAreasUseCase) {}
  @Get('my-profile/areas')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentMentorAreas(await this.useCase.execute(actor)) };
  }
}
