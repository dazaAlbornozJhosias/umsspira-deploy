import type { EventsRepository } from '../ports/events-repository.port';

export class GetPublishedEventUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(id: string) {
    return this.repository.published(id);
  }
}
