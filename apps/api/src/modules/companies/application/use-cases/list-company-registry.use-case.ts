import {
  companyAccessStatus,
  effectiveInvitationStatus,
} from '../../domain/policies/company-registration.policy';
import type { CompanyRegistryPage, CompanyRegistryQuery } from '../contracts/company-registry';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';

// US-1.4: empresas registradas por la UMSS con el estado de sus invitaciones.
export class ListCompanyRegistryUseCase {
  constructor(
    private readonly repository: CompanyInvitationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(query: CompanyRegistryQuery): Promise<CompanyRegistryPage> {
    const now = this.now();
    const { items, total } = await this.repository.listRegistry(query);
    return {
      items: items.map((company) => {
        const invitations = company.invitations.map((invitation) => ({
          ...invitation,
          status: effectiveInvitationStatus(invitation, now),
        }));
        return {
          ...company,
          invitations,
          status: companyAccessStatus(invitations.map((invitation) => invitation.status)),
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}