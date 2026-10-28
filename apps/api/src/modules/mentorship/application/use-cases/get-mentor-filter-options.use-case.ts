import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorRepository } from '../ports/mentor-repository.port';

export class GetMentorFilterOptionsUseCase {
  constructor(private readonly repository: MentorRepository) {}

  async execute(actor: ActorContext, areaIds: string[]) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_FILTER_FORBIDDEN',
        'Solo los titulados pueden consultar los filtros del directorio',
      );
    }
    return this.repository.filterOptions(areaIds);
  }
}
