import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import {
  InvitationAlreadyUsedError,
  InvitationEmailInUseError,
  InvitationExpiredError,
  InvitationNotFoundError,
  InvitationTokenInvalidError,
} from '../../domain/errors/company-invitation.errors';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { hashInvitationToken, isInvitationTokenFormat } from '../security/invitation-token';
import { assertInvitationAvailable } from './assert-invitation-available';

export class ActivateCompanyInvitationUseCase {
  constructor(
    private readonly repository: CompanyInvitationRepository,
    private readonly passwords: PasswordHasher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string, password: string): Promise<{ activated: true }> {
    if (!isInvitationTokenFormat(token)) {
      throw new InvitationTokenInvalidError();
    }
    const tokenHash = hashInvitationToken(token);
    const invitation = await this.repository.findByTokenHash(tokenHash);
    if (!invitation) {
      throw new InvitationNotFoundError();
    }
    const now = this.now();
    assertInvitationAvailable(invitation, now);

    // HU-02 CA-22: la contraseña se guarda solo como hash Argon2.
    const passwordHash = await this.passwords.hash(password);
    const result = await this.repository.activate({ tokenHash, passwordHash, now });

    if (result === 'activated') {
      return { activated: true };
    }
    if (result === 'expired') {
      throw new InvitationExpiredError();
    }
    if (result === 'used') {
      throw new InvitationAlreadyUsedError();
    }
    if (result === 'email_in_use') {
      throw new InvitationEmailInUseError();
    }
    throw new InvitationNotFoundError();
  }
}