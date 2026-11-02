import type { CompanyRole } from '../../domain/entities/company-invitation.entity';
import type { InvitationMailMessage } from './company-invitation-repository.port';

export const COMPANY_MEMBER_INVITATION_REPOSITORY = Symbol('COMPANY_MEMBER_INVITATION_REPOSITORY');

export interface NewCompanyMemberInvitation {
  companyId: string;
  actorId: string;
  name: string;
  email: string;
  role: CompanyRole;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  mail: InvitationMailMessage;
}

export type MemberInvitationResult =
  | { status: 'created'; invitationId: string }
  | { status: 'forbidden' }
  | { status: 'company_not_found' }
  | { status: 'email_in_use' }
  | { status: 'already_member' }
  | { status: 'pending' };

export interface CompanyMemberInvitationRepository {
  findCompanyName(companyId: string): Promise<string | null>;
  // Autoriza de nuevo, cancela vencidas y guarda invitación/correo atómicamente.
  create(input: NewCompanyMemberInvitation): Promise<MemberInvitationResult>;
}
