import type { PasswordHasher } from '../ports/password-hasher.port';
import type { PasswordRecoveryRepository } from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { recoveryLinkFailure } from '../services/recovery-link-failure';

// Restablece la contraseña con el enlace del correo (CA-12.3 y CA-12.4).
// Consumir el enlace, cambiar la contraseña y cerrar las sesiones ocurre en una sola transacción.
export class ResetPasswordUseCase {
  constructor(
    private readonly repository: PasswordRecoveryRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    const now = this.now();
    const outcome = await this.repository.reset({
      tokenHash: this.tokens.fingerprint(token),
      passwordHash: await this.passwords.hash(newPassword),
      now,
    });
    if (outcome.status === 'reset') {
      return;
    }
    if (outcome.status === 'expired' || outcome.status === 'used') {
      await this.repository.recordEvent({
        type: outcome.status === 'expired' ? 'enlace_vencido' : 'enlace_reutilizado',
        userId: outcome.userId,
        email: null,
        at: now,
      });
    }
    throw recoveryLinkFailure(outcome.status);
  }
}