import type { EventsRepository } from '../ports/events-repository.port';

export class GetEventCatalogUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute() {
    return this.repository.catalog();
  }
}
