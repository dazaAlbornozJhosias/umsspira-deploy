import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorAvailabilityUseCase } from '../../application/use-cases/get-mentor-availability.use-case';
import { presentAvailability } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMentorAvailabilityController {
  constructor(private readonly useCase: GetMentorAvailabilityUseCase) {}
  @Get('availability')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentAvailability(await this.useCase.execute(actor)) };
  }
}
