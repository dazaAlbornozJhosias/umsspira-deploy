// Contrato de invitaciones de empresa (Epic 4 - HU-01 y HU-02).

export interface CompanyInvitationResponse {
  companyName: string;
  email: string;
  expiresAt: string;
}

export interface ActivateCompanyInvitationPayload {
  password: string;
  confirmPassword: string;
}

export interface ActivateCompanyInvitationResponse {
  activated: true;
}

export type CompanyInvitationErrorCode =
  | 'INVITATION_TOKEN_INVALID'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_ALREADY_USED'
  | 'INVITATION_EMAIL_IN_USE'
  | 'COMPANY_TAX_ID_IN_USE'
  | 'COMPANY_ACCOUNTS_INVALID';

// US-1.4: registro de empresas por el administrador UMSS.
export type CompanyAccountRole = 'administrador' | 'reclutador';
export type CompanyInvitationStatus = 'pendiente' | 'aceptada' | 'cancelada' | 'vencida';
export type CompanyAccessStatus = 'activa' | 'pendiente' | 'vencida';

export interface CompanyInitialAccount {
  email: string;
  role: CompanyAccountRole;
}

export interface RegisterCompanyPayload {
  companyName: string;
  taxId: string;
  accounts: CompanyInitialAccount[];
}

export interface RegisteredCompanyResponse {
  companyId: string;
  companyName: string;
  taxId: string;
  invitations: { email: string; role: CompanyAccountRole; expiresAt: string }[];
}

export interface CompanyRegistryInvitation {
  id: string;
  email: string;
  role: CompanyAccountRole;
  status: CompanyInvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface CompanyRegistryItem {
  id: string;
  name: string;
  taxId: string | null;
  registeredAt: string | null;
  status: CompanyAccessStatus;
  invitations: CompanyRegistryInvitation[];
}

export interface CompanyRegistryPage {
  items: CompanyRegistryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ResentCompanyInvitationResponse {
  invitationId: string;
  email: string;
  role: CompanyAccountRole;
  expiresAt: string;
}