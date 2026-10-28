import type { EventsRepository } from '../ports/events-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class ReadEventCoverUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(id: string, actor?: ActorContext) {
    return this.repository.readCover(id, actor);
  }
}
