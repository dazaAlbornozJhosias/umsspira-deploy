import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { assertCompanyAccess } from '../../domain/policies/company-access.policy';
import { CompanyNotFoundError } from '../../domain/errors/company-not-found.error';
import type { Company } from '../../domain/entities/company.entity';
import type { UpdateCompanyProfileInput } from '../contracts/update-company-profile.input';
import type { CompanyProfileRepository } from '../ports/company-profile-repository.port';

export class UpdateCompanyProfileUseCase {
  constructor(
    private readonly companies: CompanyProfileRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    actor: ActorContext,
    companyId: string,
    input: UpdateCompanyProfileInput,
  ): Promise<Company> {
    assertCompanyAccess(actor.scopes.companyIds, companyId);
    const company = await this.companies.updateProfile(companyId, actor.id, input, this.now());
    if (!company) {
      throw new CompanyNotFoundError();
    }
    return company;
  }
}
