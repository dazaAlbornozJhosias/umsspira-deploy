import { recoveryLinkState } from '../../domain/policies/password-recovery.policy';
import type { PasswordRecoveryRepository } from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { recoveryLinkFailure } from '../services/recovery-link-failure';

// Comprueba el enlace al abrir la pantalla de nueva contraseña (CA-12.3 y CA-12.5).
export class ValidatePasswordRecoveryLinkUseCase {
  constructor(
    private readonly repository: PasswordRecoveryRepository,
    private readonly tokens: TokenService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string): Promise<void> {
    const now = this.now();
    const record = await this.repository.findByHash(this.tokens.fingerprint(token));
    if (!record) {
      throw recoveryLinkFailure('invalid');
    }
    const state = recoveryLinkState(record, now);
    if (state === 'valid') {
      await this.repository.recordEvent({
        type: 'enlace_abierto',
        userId: record.userId,
        email: null,
        at: now,
      });
      return;
    }
    if (state === 'expired' || state === 'used') {
      await this.repository.recordEvent({
        type: state === 'expired' ? 'enlace_vencido' : 'enlace_reutilizado',
        userId: record.userId,
        email: null,
        at: now,
      });
    }
    throw recoveryLinkFailure(state);
  }
}