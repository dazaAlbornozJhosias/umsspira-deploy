import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export class GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext) {
    return this.repository.summary(profileScope(actor));
  }
}
