import { Controller, Get } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { Roles } from '../../../../shared/http/auth/decorators/roles.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ListMyEventRegistrationsUseCase } from '../../application/use-cases/list-my-event-registrations.use-case';
import { presentMyEventRegistration } from '../presenters/my-event-registration.presenter';

@Controller('events')
export class ListMyEventRegistrationsController {
  constructor(private readonly useCase: ListMyEventRegistrationsUseCase) {}

  @Get('my-registrations')
  @Roles('titulado')
  async handle(@CurrentActor() actor: ActorContext) {
    const items = await this.useCase.execute(actor);
    return { data: items.map(presentMyEventRegistration) };
  }
}