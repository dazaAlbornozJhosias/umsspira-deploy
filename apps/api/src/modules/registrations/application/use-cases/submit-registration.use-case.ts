import type { SubmitRegistrationInput } from '../contracts/registration-inputs';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class SubmitRegistrationUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  execute(input: SubmitRegistrationInput) {
    return this.repository.submit(this.security.hash('draft', input.sessionToken), input);
  }
}
