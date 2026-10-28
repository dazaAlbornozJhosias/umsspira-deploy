import { Controller, Delete } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ClearMentorInformationUseCase } from '../../application/use-cases/clear-mentor-information.use-case';

@Controller('mentorship')
export class ClearMentorInformationController {
  constructor(private readonly useCase: ClearMentorInformationUseCase) {}
  @Delete('my-profile/information')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: await this.useCase.execute(actor) };
  }
}
