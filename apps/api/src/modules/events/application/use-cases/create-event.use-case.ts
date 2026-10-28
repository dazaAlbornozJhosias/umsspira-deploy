import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CreateEventInput } from '../contracts/event-inputs';
import { validateEventDates } from '../../domain/policies/event.policy';

export class CreateEventUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, input: CreateEventInput) {
    validateEventDates(new Date(input.startDate), new Date(input.endDate));
    return this.repository.create(actor.id, input);
  }
}
