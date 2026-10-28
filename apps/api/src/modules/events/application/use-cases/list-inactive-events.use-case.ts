import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class ListInactiveEventsUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext) {
    return this.repository.inactive(actor.id, new Date());
  }
}
