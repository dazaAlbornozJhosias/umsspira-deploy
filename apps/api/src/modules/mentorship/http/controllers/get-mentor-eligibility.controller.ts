import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorEligibilityUseCase } from '../../application/use-cases/get-mentor-eligibility.use-case';

@Controller('mentorship')
export class GetMentorEligibilityController {
  constructor(private readonly useCase: GetMentorEligibilityUseCase) {}
  @Get('eligibility')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: await this.useCase.execute(actor) };
  }
}
