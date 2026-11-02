import type { CompanyRole } from '../../domain/entities/company-invitation.entity';

// US-1.4: alta de empresa por la UMSS con 1 a N cuentas iniciales.
export interface CreateCompanyInvitationInput {
  companyName: string;
  taxId: string;
  accounts: { email: string; role: CompanyRole }[];
}

export interface CreatedCompanyInvitation {
  companyId: string;
  companyName: string;
  taxId: string;
  invitations: { email: string; role: CompanyRole; expiresAt: Date }[];
}

export interface InvitationMail {
  subject: string;
  text: string;
  html: string;
}

export type InvitationMailComposer = (input: {
  companyName: string;
  activationUrl: string;
  logoUrl?: string;
}) => InvitationMail;