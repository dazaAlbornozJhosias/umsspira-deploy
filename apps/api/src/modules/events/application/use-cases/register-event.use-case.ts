import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../ports/events-repository.port';

export class RegisterEventUseCase {
  constructor(private readonly repository: EventsRepository) {}

  execute(actor: ActorContext, eventId: string) {
    return this.repository.register(actor.id, eventId);
  }
}
