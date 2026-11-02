import type { CompanyInvitation } from '../../domain/entities/company-invitation.entity';
import {
  InvitationAlreadyUsedError,
  InvitationExpiredError,
  InvitationNotFoundError,
} from '../../domain/errors/company-invitation.errors';
import { checkInvitationAvailability } from '../../domain/policies/company-invitation.policy';

export function assertInvitationAvailable(invitation: CompanyInvitation, now: Date): void {
  const availability = checkInvitationAvailability(invitation, now);
  if (availability === 'used') {
    throw new InvitationAlreadyUsedError();
  }
  if (availability === 'expired') {
    throw new InvitationExpiredError();
  }
  if (availability === 'cancelled') {
    throw new InvitationNotFoundError();
  }
}