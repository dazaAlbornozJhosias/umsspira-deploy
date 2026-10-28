import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorInterestCatalogUseCase } from '../../application/use-cases/get-mentor-interest-catalog.use-case';
import { presentInterestCatalog } from '../presenters/mentor.presenter';

@Controller('mentorship')
export class GetMentorInterestCatalogController {
  constructor(private readonly useCase: GetMentorInterestCatalogUseCase) {}
  @Get('interests/catalog')
  @RequirePermissions('mentores:self:write')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: presentInterestCatalog(await this.useCase.execute(actor)) };
  }
}
