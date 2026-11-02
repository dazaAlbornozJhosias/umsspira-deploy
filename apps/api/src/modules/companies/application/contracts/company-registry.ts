import type { CompanyRole, InvitationStatus } from '../../domain/entities/company-invitation.entity';
import type { CompanyAccessStatus } from '../../domain/policies/company-registration.policy';

export interface CompanyRegistryQuery {
  search?: string;
  page: number;
  pageSize: number;
}

export interface RegistryInvitation {
  id: string;
  email: string;
  role: CompanyRole;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export interface RegistryCompanyRecord {
  id: string;
  name: string;
  taxId: string | null;
  registeredAt: Date | null;
  invitations: RegistryInvitation[];
}

export interface RegistryCompany extends RegistryCompanyRecord {
  status: CompanyAccessStatus;
}

export interface CompanyRegistryPage {
  items: RegistryCompany[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ResentCompanyInvitation {
  invitationId: string;
  email: string;
  role: CompanyRole;
  expiresAt: Date;
}