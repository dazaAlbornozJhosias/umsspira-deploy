import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

import { ListInactiveEventsUseCase } from '../../application/use-cases/list-inactive-events.use-case';
import { presentInactiveEvent } from '../presenters/event.presenter';

@Controller('events')
export class ListInactiveEventsController {
  constructor(private readonly useCase: ListInactiveEventsUseCase) {}

  @Get('inactive')
  @RequirePermissions('eventos:manage')
  async handle(@CurrentActor() actor: ActorContext) {
    return { data: (await this.useCase.execute(actor)).map(presentInactiveEvent) };
  }
}
