import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { ACTIVATION_TOKEN_SECONDS } from '../../domain/policies/activation.policy';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import { issueActivationToken } from '../security/activation-token';

// Paso 1 de la activación: valida el código y entrega un pase firmado para el paso 2.
export class VerifyActivationCodeUseCase {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(id: string, code: string) {
    const check = await this.repository.verifyActivation(
      id,
      this.security.hash('activation', id + ':' + code),
    );
    if (check.result === 'expired') {
      throw new BusinessRuleError(
        'expired',
        'ACTIVATION_EXPIRED',
        'El código de activación venció',
      );
    }
    if (check.result === 'locked') {
      throw new BusinessRuleError(
        'limited',
        'ACTIVATION_ATTEMPTS_EXCEEDED',
        'Se agotaron los intentos de activación',
      );
    }
    if (check.result !== 'verified') {
      throw new BusinessRuleError(
        'invalid',
        'INVALID_ACTIVATION',
        'El código no es válido o ya fue utilizado',
      );
    }
    return {
      activationToken: issueActivationToken(this.security, id, check.binding),
      expiresInSeconds: ACTIVATION_TOKEN_SECONDS,
    };
  }
}