import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class DeleteEventCoverUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string) {
    return this.repository.removeCover(actor.id, id);
  }
}
