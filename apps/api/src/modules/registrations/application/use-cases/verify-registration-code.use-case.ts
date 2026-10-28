import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class VerifyRegistrationCodeUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(token: string, code: string, expectedEmail?: string) {
    const result = await this.repository.verifyCode(
      this.security.hash('draft', token),
      this.security.hash('otp', token + ':' + code),
      ...(expectedEmail ? [expectedEmail] : []),
    );
    if (result === 'expired') {
      throw new BusinessRuleError('expired', 'CODE_EXPIRED', 'El código venció; solicita otro');
    }
    if (result === 'locked') {
      throw new BusinessRuleError('limited', 'CODE_ATTEMPTS_EXCEEDED', 'Solicita un código nuevo');
    }
    if (result !== 'verified') {
      throw new BusinessRuleError('invalid', 'INVALID_CODE', 'El código no es correcto');
    }
    return { verified: true };
  }
}
