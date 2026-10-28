import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class ClearMentorInformationUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext) {
    await this.repository.clearInformation(actor.id);
    return { exists: false, profile: null };
  }
}
