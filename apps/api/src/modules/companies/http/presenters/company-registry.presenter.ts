import type { CompanyRegistryPage, ResentCompanyInvitation } from '../../application/contracts/company-registry';

export function presentCompanyRegistryPage(page: CompanyRegistryPage) {
  return {
    items: page.items.map((company) => ({
      id: company.id,
      name: company.name,
      taxId: company.taxId,
      registeredAt: company.registeredAt?.toISOString() ?? null,
      status: company.status,
      invitations: company.invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString(),
        acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      })),
    })),
    total: page.total,
    page: page.page,
    pageSize: page.pageSize,
  };
}

export function presentResentCompanyInvitation(resent: ResentCompanyInvitation) {
  return {
    invitationId: resent.invitationId,
    email: resent.email,
    role: resent.role,
    expiresAt: resent.expiresAt.toISOString(),
  };
}