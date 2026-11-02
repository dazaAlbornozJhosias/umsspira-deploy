import { InvitationNotFoundError, InvitationTokenInvalidError } from '../../domain/errors/company-invitation.errors';
import { maskEmail } from '../../domain/policies/company-invitation.policy';
import type { CompanyInvitationSummary } from '../contracts/company-invitation-summary';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { hashInvitationToken, isInvitationTokenFormat } from '../security/invitation-token';
import { assertInvitationAvailable } from './assert-invitation-available';

export class ValidateCompanyInvitationUseCase {
  constructor(
    private readonly repository: CompanyInvitationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string): Promise<CompanyInvitationSummary> {
    if (!isInvitationTokenFormat(token)) {
      throw new InvitationTokenInvalidError();
    }
    const invitation = await this.repository.findByTokenHash(hashInvitationToken(token));
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    assertInvitationAvailable(invitation, this.now());
    return {
      companyName: invitation.companyName,
      email: maskEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    };
  }
}