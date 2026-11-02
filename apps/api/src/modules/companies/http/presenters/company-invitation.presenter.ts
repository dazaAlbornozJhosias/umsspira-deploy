import type { CompanyInvitationSummary } from '../../application/contracts/company-invitation-summary';
import type { CreatedCompanyInvitation } from '../../application/contracts/create-company-invitation.input';

export function presentCompanyInvitation(summary: CompanyInvitationSummary) {
  return {
    companyName: summary.companyName,
    email: summary.email,
    expiresAt: summary.expiresAt.toISOString(),
  };
}

export function presentCreatedCompanyInvitation(created: CreatedCompanyInvitation) {
  return {
    companyId: created.companyId,
    companyName: created.companyName,
    taxId: created.taxId,
    invitations: created.invitations.map((invitation) => ({
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    })),
  };
}