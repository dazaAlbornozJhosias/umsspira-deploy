import { AccessError } from '../../../../shared/security/errors/access-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CredentialRepository } from '../ports/credential-repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { AccessLimiter } from '../services/access-limiter.service';

export class ChangePasswordUseCase {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly passwords: PasswordHasher,
    private readonly limiter: AccessLimiter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, currentPassword: string, newPassword: string): Promise<void> {
    await this.limiter.check(`password:${actor.id}`, 900_000, 5);
    const credential = await this.credentials.findByEmail(actor.email);
    const valid = await this.passwords.verify(currentPassword, credential?.passwordHash ?? null);
    if (!credential || !valid || credential.userId !== actor.id) {
      throw new AccessError('INVALID_CREDENTIALS');
    }
    if (
      !(await this.credentials.changePassword(
        credential,
        await this.passwords.hash(newPassword),
        this.now(),
      ))
    ) {
      throw new AccessError('PASSWORD_CONFLICT');
    }
  }
}
