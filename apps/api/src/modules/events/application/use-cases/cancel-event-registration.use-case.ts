import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../ports/events-repository.port';

export class CancelEventRegistrationUseCase {
  constructor(private readonly repository: EventsRepository) {}

  execute(actor: ActorContext, registrationId: string): Promise<void> {
    return this.repository.cancelRegistration(actor.id, registrationId, new Date());
  }
}
