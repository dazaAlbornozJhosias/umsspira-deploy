import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export class GetMyMentorProfileUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext) {
    const mentor = await this.repository.own(actor.id);
    if (!mentor) {
      throw new BusinessRuleError(
        'missing',
        'MENTOR_NOT_FOUND',
        'El usuario no tiene perfil de mentor',
      );
    }
    return mentor;
  }
}
