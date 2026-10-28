import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class RetireEventUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string) {
    return this.repository.retire(actor.id, id, new Date());
  }
}
