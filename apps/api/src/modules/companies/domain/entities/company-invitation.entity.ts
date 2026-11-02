// Valores en minúsculas: deben coincidir con los CHECK de la tabla empresa_invitacion.
export const INVITATION_STATUSES = ['pendiente', 'aceptada', 'cancelada', 'vencida'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const COMPANY_ROLES = ['administrador', 'reclutador'] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export interface CompanyInvitation {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: CompanyRole;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  name?: string | null;
}
