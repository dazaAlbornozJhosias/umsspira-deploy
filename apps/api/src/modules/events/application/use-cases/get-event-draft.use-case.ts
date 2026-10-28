import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { assertDraft } from '../../domain/policies/event.policy';

export class GetEventDraftUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string) {
    const event = await this.repository.findOwned(actor.id, id);
    assertDraft(event);
    return event;
  }
}
