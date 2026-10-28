import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export class ReadCertificationBackupUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, id: string) {
    return this.repository.readBackup(profileScope(actor), id);
  }
}
