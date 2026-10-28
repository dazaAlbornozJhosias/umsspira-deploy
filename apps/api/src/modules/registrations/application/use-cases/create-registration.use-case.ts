import type { RegistrationData } from '../../domain/entities/registration';
import { DRAFT_SECONDS } from '../../domain/policies/registration.policy';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class CreateRegistrationUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(data: RegistrationData) {
    const token = this.security.token();
    await this.repository.createDraft(
      this.security.hash('draft', token),
      data,
      new Date(Date.now() + DRAFT_SECONDS * 1000),
    );
    return { sessionToken: token, expiresInSeconds: DRAFT_SECONDS };
  }
}
