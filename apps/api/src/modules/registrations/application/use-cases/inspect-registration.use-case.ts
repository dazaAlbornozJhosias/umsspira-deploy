import { assertOpenDraft } from '../../domain/policies/registration.policy';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class InspectRegistrationUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(token: string) {
    const draft = await this.repository.findDraft(this.security.hash('draft', token));
    assertOpenDraft(draft);
    return {
      sessionToken: token,
      expiresInSeconds: Math.max(0, Math.floor((draft.expiresAt.getTime() - Date.now()) / 1000)),
      isEmailVerified: draft.verified,
    };
  }
}
