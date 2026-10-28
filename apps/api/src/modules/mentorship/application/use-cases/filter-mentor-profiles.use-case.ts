import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorDirectoryFilters } from '../contracts/mentor-directory-filters';
import type { MentorRepository } from '../ports/mentor-repository.port';

export class FilterMentorProfilesUseCase {
  constructor(private readonly repository: MentorRepository) {}

  async execute(actor: ActorContext, filters: MentorDirectoryFilters) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_FILTER_FORBIDDEN',
        'Solo los titulados pueden filtrar el directorio de mentores',
      );
    }
    return this.repository.filteredDirectory(filters);
  }
}
