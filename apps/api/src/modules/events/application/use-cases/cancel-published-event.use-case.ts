import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../ports/events-repository.port';

export class CancelPublishedEventUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string) {
    return this.repository.cancelPublished(actor.id, id);
  }
}
