import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';
import type { ProfileChange } from '../contracts/profile-inputs';

export class UpdateProfileRecordUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, id: string, change: ProfileChange) {
    return this.repository.update(profileScope(actor), id, change);
  }
}
