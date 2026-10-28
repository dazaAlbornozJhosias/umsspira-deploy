import type { RegistrationRepository } from '../ports/registration-repository.port';

export class ListRegistrationCareersUseCase {
  constructor(private readonly repository: RegistrationRepository) {}

  execute() {
    return this.repository.listCareers();
  }
}
