import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { withParticipationStatus } from '../../domain/policies/my-event-status.policy';
import type { EventsRepository } from '../ports/events-repository.port';

export class ListMyEventRegistrationsUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext) {
    const items = await this.repository.mine(actor.id);
    return withParticipationStatus(items, new Date());
  }
}