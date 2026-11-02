import type { CompanyInvitation, CompanyRole } from '../../domain/entities/company-invitation.entity';
import type { CompanyRegistryQuery, RegistryCompanyRecord } from '../contracts/company-registry';
export const COMPANY_INVITATION_REPOSITORY = Symbol('COMPANY_INVITATION_REPOSITORY');

export type InvitationActivationResult = 'activated' | 'not_found' | 'expired' | 'used' | 'email_in_use';

export interface ActivateInvitationInput {
  tokenHash: string;
  passwordHash: string;
  now: Date;
}

export interface InvitationMailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface NewInvitationAccount {
  email: string;
  role: CompanyRole;
  tokenHash: string;
  mail: InvitationMailMessage;
}

export interface NewCompanyRegistration {
  companyName: string;
  taxId: string;
  contactEmail: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  accounts: NewInvitationAccount[];
}

export interface ReplaceInvitationInput {
  previousId: string;
  companyId: string;
  email: string;
  role: CompanyRole;
  tokenHash: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  mail: InvitationMailMessage;
}

export interface CompanyInvitationRepository {
  findByTokenHash(tokenHash: string): Promise<CompanyInvitation | null>;
  // Debe volver a comprobar la invitación dentro de la transacción (doble envío del formulario).
  activate(input: ActivateInvitationInput): Promise<InvitationActivationResult>;
  // Devuelve los correos de la lista que ya tienen una cuenta.
  findEmailsWithAccount(emails: string[]): Promise<string[]>;
  taxIdExists(taxId: string): Promise<boolean>;
  // Crea la empresa, sus invitaciones y los correos pendientes en una sola transacción.
  createCompanyWithInvitations(input: NewCompanyRegistration): Promise<{ companyId: string }>;
  findById(id: string): Promise<CompanyInvitation | null>;
  listRegistry(query: CompanyRegistryQuery): Promise<{ items: RegistryCompanyRecord[]; total: number }>;
  // Cancela la invitación anterior y crea la nueva con su correo en una transacción; null si ya no estaba pendiente.
  replaceInvitation(input: ReplaceInvitationInput): Promise<{ invitationId: string } | null>;
}