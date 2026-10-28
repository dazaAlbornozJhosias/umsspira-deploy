import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../ports/events-repository.port';

export class GetEventParticipantsUseCase {
  constructor(private readonly repository: EventsRepository) {}

  execute(actor: ActorContext, eventId: string) {
    return this.repository.participants(actor.id, eventId);
  }
}