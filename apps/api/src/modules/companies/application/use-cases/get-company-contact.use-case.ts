import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { assertCompanyAccess } from '../../domain/policies/company-access.policy';
import { CompanyNotFoundError } from '../../domain/errors/company-not-found.error';
import type { CompanyContact } from '../contracts/company-contact';
import type { CompanyProfileRepository } from '../ports/company-profile-repository.port';

export class GetCompanyContactUseCase {
  constructor(private readonly companies: CompanyProfileRepository) {}

  async execute(actor: ActorContext, companyId: string): Promise<CompanyContact> {
    assertCompanyAccess(actor.scopes.companyIds, companyId);
    const company = await this.companies.findContact(companyId, actor.id);
    if (!company) {
      throw new CompanyNotFoundError();
    }
    return company;
  }
}
