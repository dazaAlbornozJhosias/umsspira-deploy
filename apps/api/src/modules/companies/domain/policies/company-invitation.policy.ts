import type { CompanyInvitation } from '../entities/company-invitation.entity';

export type InvitationAvailability = 'available' | 'expired' | 'used' | 'cancelled';

// La vigencia se calcula siempre con expira_en: una invitación puede seguir en "pendiente" ya vencida.
export function checkInvitationAvailability(
  invitation: Pick<CompanyInvitation, 'status' | 'expiresAt' | 'acceptedAt'>,
  now: Date,
): InvitationAvailability {
  if (invitation.status === 'aceptada' || invitation.acceptedAt) {
    return 'used';
  }
  if (invitation.status === 'cancelada') {
    return 'cancelled';
  }
  if (invitation.status === 'vencida' || invitation.expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }
  return 'available';
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }
  return `${local.slice(0, 2)}***@${domain}`;
}