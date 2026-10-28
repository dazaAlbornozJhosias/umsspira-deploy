import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import { matchesBinding, parseActivationToken } from '../security/activation-token';

// Paso 2 de la activación: con el pase del paso 1 y una contraseña válida crea la cuenta.
export class ActivateRegistrationUseCase {
  constructor(
    private readonly repository: ApplicationsRepository,
    private readonly security: RegistrationSecurity,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(id: string, activationToken: string, password: string) {
    const token = parseActivationToken(activationToken);
    if (!token || token.applicationId !== id) {
      throw new BusinessRuleError(
        'invalid',
        'INVALID_ACTIVATION_TOKEN',
        'El pase de activación no es válido; valida el código otra vez',
      );
    }
    if (token.expiresAt <= Date.now()) {
      throw new BusinessRuleError(
        'expired',
        'ACTIVATION_TOKEN_EXPIRED',
        'El pase de activación venció; valida el código otra vez',
      );
    }
    const result = await this.repository.activate(
      id,
      await this.passwords.hash(password),
      (binding) => matchesBinding(this.security, token, binding),
    );
    if (result === 'expired') {
      throw new BusinessRuleError(
        'expired',
        'ACTIVATION_EXPIRED',
        'El código de activación venció',
      );
    }
    if (result === 'locked') {
      throw new BusinessRuleError(
        'limited',
        'ACTIVATION_ATTEMPTS_EXCEEDED',
        'Se agotaron los intentos de activación',
      );
    }
    if (result === 'already') {
      throw new BusinessRuleError(
        'conflict',
        'ACTIVATION_ALREADY_DONE',
        'Tu cuenta ya está activa. Inicia sesión o recupera tu contraseña',
      );
    }
    if (result === 'account-exists') {
      throw new BusinessRuleError(
        'conflict',
        'ACCOUNT_ALREADY_EXISTS',
        'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña',
      );
    }
    if (result !== 'activated') {
      throw new BusinessRuleError(
        'invalid',
        'INVALID_ACTIVATION',
        'La activación no es válida o ya fue utilizada',
      );
    }
    return { activated: true };
  }
}