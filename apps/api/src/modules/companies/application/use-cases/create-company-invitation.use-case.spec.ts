import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { hashInvitationToken } from '../security/invitation-token';
import { CreateCompanyInvitationUseCase } from './create-company-invitation.use-case';

const now = new Date('2026-10-27T12:00:00Z');
const actor = { id: 'admin-id', role: 'administrador' } as ActorContext;

const input = {
  companyName: 'TechSolutions S.A.',
  taxId: '1023456029',
  accounts: [
    { email: 'Gerencia@Empresa.com ', role: 'administrador' as const },
    { email: 'rrhh@empresa.com', role: 'reclutador' as const },
  ],
};

function build({ taxIdExists = false, emailsWithAccount = [] as string[] } = {}) {
  const repository = {
    taxIdExists: jest.fn().mockResolvedValue(taxIdExists),
    findEmailsWithAccount: jest.fn().mockResolvedValue(emailsWithAccount),
    createCompanyWithInvitations: jest.fn().mockResolvedValue({ companyId: 'empresa-1' }),
  };
  const composeMail = jest.fn().mockReturnValue({ subject: 'Asunto', text: 'Texto', html: '<p>Html</p>' });
  const useCase = new CreateCompanyInvitationUseCase(
    repository as unknown as CompanyInvitationRepository,
    composeMail,
    'http://web.test/',
    () => now,
  );
  return { useCase, repository, composeMail };
}

describe('CreateCompanyInvitationUseCase', () => {
  it('registra la empresa con una invitación por cuenta, vigentes por 7 días', async () => {
    const { useCase, repository } = build();
    const result = await useCase.execute(actor, input);

    const expiresAt = new Date('2026-11-03T12:00:00Z');
    expect(result).toEqual({
      companyId: 'empresa-1',
      companyName: 'TechSolutions S.A.',
      taxId: '1023456029',
      invitations: [
        { email: 'gerencia@empresa.com', role: 'administrador', expiresAt },
        { email: 'rrhh@empresa.com', role: 'reclutador', expiresAt },
      ],
    });
    const saved = repository.createCompanyWithInvitations.mock.calls[0][0];
    expect(saved).toMatchObject({
      taxId: '1023456029',
      contactEmail: 'gerencia@empresa.com',
      createdBy: 'admin-id',
      createdAt: now,
      expiresAt,
    });
    expect(saved.accounts).toHaveLength(2);
  });

  it('genera un token distinto por cuenta y lo envía en el enlace', async () => {
    const { useCase, repository, composeMail } = build();
    await useCase.execute(actor, input);

    const saved = repository.createCompanyWithInvitations.mock.calls[0][0];
    composeMail.mock.calls.forEach(([mailInput]: [{ activationUrl: string }], index: number) => {
      expect(mailInput.activationUrl).toMatch(/^http:\/\/web\.test\/company-invitation\/[A-Za-z0-9_-]{43}$/);
      const token = mailInput.activationUrl.split('/').pop() as string;
      expect(saved.accounts[index].tokenHash).toBe(hashInvitationToken(token));
    });
    expect(saved.accounts[0].tokenHash).not.toBe(saved.accounts[1].tokenHash);
    expect(saved.accounts[1].mail).toEqual({
      to: 'rrhh@empresa.com',
      subject: 'Asunto',
      text: 'Texto',
      html: '<p>Html</p>',
    });
  });

  it('exige al menos un administrador', async () => {
    const { useCase, repository } = build();
    await expect(
      useCase.execute(actor, { ...input, accounts: [{ email: 'rrhh@empresa.com', role: 'reclutador' }] }),
    ).rejects.toMatchObject({ code: 'COMPANY_ACCOUNTS_INVALID' });
    expect(repository.createCompanyWithInvitations).not.toHaveBeenCalled();
  });

  it('rechaza correos repetidos aunque cambien mayúsculas', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute(actor, {
        ...input,
        accounts: [
          { email: 'a@empresa.com', role: 'administrador' },
          { email: 'A@EMPRESA.COM', role: 'reclutador' },
        ],
      }),
    ).rejects.toMatchObject({ code: 'COMPANY_ACCOUNTS_INVALID' });
  });

  it('rechaza un NIT ya registrado', async () => {
    const { useCase, repository } = build({ taxIdExists: true });
    await expect(useCase.execute(actor, input)).rejects.toMatchObject({ code: 'COMPANY_TAX_ID_IN_USE' });
    expect(repository.createCompanyWithInvitations).not.toHaveBeenCalled();
  });

  it('rechaza un correo que ya tiene cuenta', async () => {
    const { useCase, repository } = build({ emailsWithAccount: ['rrhh@empresa.com'] });
    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: 'INVITATION_EMAIL_IN_USE',
      message: 'El correo rrhh@empresa.com ya tiene una cuenta registrada',
    });
    expect(repository.createCompanyWithInvitations).not.toHaveBeenCalled();
  });
});