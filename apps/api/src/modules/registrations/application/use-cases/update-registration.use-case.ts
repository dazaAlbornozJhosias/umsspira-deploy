import type { RegistrationData } from '../../domain/entities/registration';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class UpdateRegistrationUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  execute(token: string, data: RegistrationData) {
    return this.repository.updateDraft(this.security.hash('draft', token), data);
  }
}
