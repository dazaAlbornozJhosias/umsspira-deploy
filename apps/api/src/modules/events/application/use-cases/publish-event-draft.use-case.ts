import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class PublishEventDraftUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string) {
    return this.repository.publishDraft(actor.id, id);
  }
}
