import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export class ExportProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext) {
    return { profile: await this.repository.summary(profileScope(actor)), exportedAt: new Date() };
  }
}
