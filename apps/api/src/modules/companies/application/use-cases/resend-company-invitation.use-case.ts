import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import {
  InvitationAlreadyUsedError,
  InvitationEmailInUseError,
  InvitationNotFoundError,
} from '../../domain/errors/company-invitation.errors';
import { checkInvitationAvailability } from '../../domain/policies/company-invitation.policy';
import type { ResentCompanyInvitation } from '../contracts/company-registry';
import type { InvitationMailComposer } from '../contracts/create-company-invitation.input';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { generateInvitationToken, INVITATION_VALIDITY_DAYS } from '../security/invitation-token';

const DAY_MS = 24 * 60 * 60 * 1000;

// US-1.4: reenvía una invitación pendiente o vencida con un token nuevo; el enlace anterior deja de servir.
export class ResendCompanyInvitationUseCase {
  constructor(
    private readonly repository: CompanyInvitationRepository,
    private readonly composeMail: InvitationMailComposer,
    private readonly webUrl: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, invitationId: string): Promise<ResentCompanyInvitation> {
    const invitation = await this.repository.findById(invitationId);
    if (!invitation) {
      throw new InvitationNotFoundError();
    }

    const createdAt = this.now();
    const availability = checkInvitationAvailability(invitation, createdAt);
    if (availability === 'used') {
      throw new InvitationAlreadyUsedError();
    }
    if (availability === 'cancelled') {
      throw new InvitationNotFoundError();
    }
    const [emailInUse] = await this.repository.findEmailsWithAccount([invitation.email]);
    if (emailInUse) {
      throw new InvitationEmailInUseError(emailInUse);
    }

    const { token, tokenHash } = generateInvitationToken();
    const expiresAt = new Date(createdAt.getTime() + INVITATION_VALIDITY_DAYS * DAY_MS);
    const webUrl = this.webUrl.replace(/\/+$/, '');
    const mail = this.composeMail({
      companyName: invitation.companyName,
      activationUrl: `${webUrl}/company-invitation/${token}`,
      logoUrl: `${webUrl}/umsspira-logo.png`,
    });

    const replaced = await this.repository.replaceInvitation({
      previousId: invitation.id,
      companyId: invitation.companyId,
      email: invitation.email,
      role: invitation.role,
      tokenHash,
      createdBy: actor.id,
      createdAt,
      expiresAt,
      mail: { to: invitation.email, subject: mail.subject, text: mail.text, html: mail.html },
    });
    // Otra petición la aceptó o la reenvió al mismo tiempo.
    if (!replaced) {
      throw new InvitationAlreadyUsedError();
    }

    return {
      invitationId: replaced.invitationId,
      email: invitation.email,
      role: invitation.role,
      expiresAt,
    };
  }
}