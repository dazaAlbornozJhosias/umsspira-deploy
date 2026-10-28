import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorInformationUseCase } from '../../application/use-cases/get-mentor-information.use-case';
import { presentMentorInformation } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMentorInformationController {
  constructor(private readonly useCase: GetMentorInformationUseCase) {}
  @Get('my-profile/information')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentMentorInformation(await this.useCase.execute(actor)) };
  }
}
