import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class GetDraftDocumentUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  execute(token: string) {
    return this.repository.draftDocument(this.security.hash('draft', token));
  }
}
