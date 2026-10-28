import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { assertCompanyAccess } from '../../domain/policies/company-access.policy';
import { CompanyNotFoundError } from '../../domain/errors/company-not-found.error';
import type { CompanyHeader } from '../contracts/company-header';
import type { CompanyProfileRepository } from '../ports/company-profile-repository.port';

export class GetCompanyHeaderUseCase {
  constructor(private readonly companies: CompanyProfileRepository) {}

  async execute(actor: ActorContext, companyId: string): Promise<CompanyHeader> {
    assertCompanyAccess(actor.scopes.companyIds, companyId);
    const company = await this.companies.findHeader(companyId, actor.id);
    if (!company) {
      throw new CompanyNotFoundError();
    }
    return company;
  }
}
