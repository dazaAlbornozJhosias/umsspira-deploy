import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class DeactivateMentorUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext, id: string) {
    return this.repository.deactivate(id, actor.scopes.careerIds);
  }
}
