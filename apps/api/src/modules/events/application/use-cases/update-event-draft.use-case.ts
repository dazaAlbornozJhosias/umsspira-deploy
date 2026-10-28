import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventInput } from '../contracts/event-inputs';
import { validateEventDates } from '../../domain/policies/event.policy';

export class UpdateEventDraftUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, id: string, input: EventInput) {
    validateEventDates(new Date(input.startDate), new Date(input.endDate));
    return this.repository.updateDraft(actor.id, id, input);
  }
}
