import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { ListOwnedEventsUseCase } from '../../application/use-cases/list-owned-events.use-case';
import { presentEvent } from '../presenters/event.presenter';

@Controller('events')
export class ListOwnedEventsController {
  constructor(private readonly useCase: ListOwnedEventsUseCase) {}

  @Get('owned')
  @RequirePermissions('eventos:manage')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: (await this.useCase.execute(actor)).map(presentEvent) };
  }
}
