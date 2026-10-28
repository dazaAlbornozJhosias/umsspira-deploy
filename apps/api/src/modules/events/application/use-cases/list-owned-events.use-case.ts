import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class ListOwnedEventsUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext) {
    return this.repository.owned(actor.id);
  }
}
