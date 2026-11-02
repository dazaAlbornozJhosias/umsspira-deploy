import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import {
  CompanyAccountsInvalidError,
  CompanyTaxIdInUseError,
  InvitationEmailInUseError,
} from '../../domain/errors/company-invitation.errors';
import { checkInitialAccounts } from '../../domain/policies/company-registration.policy';
import type {
  CreateCompanyInvitationInput,
  CreatedCompanyInvitation,
  InvitationMailComposer,
} from '../contracts/create-company-invitation.input';
import type {
  CompanyInvitationRepository,
  NewInvitationAccount,
} from '../ports/company-invitation-repository.port';
import { generateInvitationToken, INVITATION_VALIDITY_DAYS } from '../security/invitation-token';

const DAY_MS = 24 * 60 * 60 * 1000;

// US-1.4: el administrador UMSS registra la empresa y habilita sus cuentas iniciales.
export class CreateCompanyInvitationUseCase {
  constructor(
    private readonly repository: CompanyInvitationRepository,
    private readonly composeMail: InvitationMailComposer,
    private readonly webUrl: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, input: CreateCompanyInvitationInput): Promise<CreatedCompanyInvitation> {
    const companyName = input.companyName.trim();
    const taxId = input.taxId.trim();
    const accounts = input.accounts.map((account) => ({
      email: account.email.trim().toLowerCase(),
      role: account.role,
    }));

    const problem = checkInitialAccounts(accounts);
    if (problem) {
      throw new CompanyAccountsInvalidError(problem);
    }
    if (await this.repository.taxIdExists(taxId)) {
      throw new CompanyTaxIdInUseError();
    }
    const [emailInUse] = await this.repository.findEmailsWithAccount(accounts.map((account) => account.email));
    if (emailInUse) {
      throw new InvitationEmailInUseError(emailInUse);
    }

    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + INVITATION_VALIDITY_DAYS * DAY_MS);
    const webUrl = this.webUrl.replace(/\/+$/, '');

    // Cada cuenta recibe su propio token y su propio correo.
    const invitations: NewInvitationAccount[] = accounts.map((account) => {
      const { token, tokenHash } = generateInvitationToken();
      const mail = this.composeMail({
        companyName,
        activationUrl: `${webUrl}/company-invitation/${token}`,
        logoUrl: `${webUrl}/umsspira-logo.png`,
      });
      return {
        ...account,
        tokenHash,
        mail: { to: account.email, subject: mail.subject, text: mail.text, html: mail.html },
      };
    });

    // El correo de contacto de la empresa es el del primer administrador.
    const contactEmail = (accounts.find((account) => account.role === 'administrador') ?? accounts[0]).email;

    const { companyId } = await this.repository.createCompanyWithInvitations({
      companyName,
      taxId,
      contactEmail,
      createdBy: actor.id,
      createdAt,
      expiresAt,
      accounts: invitations,
    });

    return {
      companyId,
      companyName,
      taxId,
      invitations: accounts.map((account) => ({ ...account, expiresAt })),
    };
  }
}