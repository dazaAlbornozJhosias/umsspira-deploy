import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import type { CompanyInvitation } from '../../domain/entities/company-invitation.entity';
import type {
  CompanyInvitationRepository,
  InvitationActivationResult,
} from '../ports/company-invitation-repository.port';
import { hashInvitationToken } from '../security/invitation-token';
import { ActivateCompanyInvitationUseCase } from './activate-company-invitation.use-case';

const token = 'B'.repeat(43);
const now = new Date('2026-10-27T12:00:00Z');
const invitation: CompanyInvitation = {
  id: '11111111-1111-4111-8111-111111111111',
  companyId: '22222222-2222-4222-8222-222222222222',
  companyName: 'TechSolutions S.A.',
  email: 'contacto@techsolutions.com',
  role: 'administrador',
  status: 'pendiente',
  expiresAt: new Date('2026-11-03T12:00:00Z'),
  acceptedAt: null,
};
const passwords: PasswordHasher = {
  hash: async (password) => 'argon2:' + password,
  verify: async () => true,
  needsRehash: () => false,
};

function build(found: CompanyInvitation | null, result: InvitationActivationResult = 'activated') {
  const findByTokenHash = jest.fn().mockResolvedValue(found);
  const activate = jest.fn().mockResolvedValue(result);
  const repository = { findByTokenHash, activate } as unknown as CompanyInvitationRepository;
  return { activate, useCase: new ActivateCompanyInvitationUseCase(repository, passwords, () => now) };
}

describe('ActivateCompanyInvitationUseCase', () => {
  it('activa la cuenta guardando solo el hash de la contraseña', async () => {
    const { useCase, activate } = build(invitation);
    await expect(useCase.execute(token, 'Abc12345')).resolves.toEqual({ activated: true });
    expect(activate).toHaveBeenCalledWith({
      tokenHash: hashInvitationToken(token),
      passwordHash: 'argon2:Abc12345',
      now,
    });
  });

  it('no activa con un token de formato inválido', async () => {
    const { useCase, activate } = build(invitation);
    await expect(useCase.execute('abc', 'Abc12345')).rejects.toMatchObject({ code: 'INVITATION_TOKEN_INVALID' });
    expect(activate).not.toHaveBeenCalled();
  });

  it('no activa una invitación ya usada (enlace reutilizado)', async () => {
    const { useCase, activate } = build({ ...invitation, status: 'aceptada', acceptedAt: now });
    await expect(useCase.execute(token, 'Abc12345')).rejects.toMatchObject({ code: 'INVITATION_ALREADY_USED' });
    expect(activate).not.toHaveBeenCalled();
  });

  it('no activa una invitación vencida', async () => {
    const { useCase, activate } = build({ ...invitation, expiresAt: new Date(now.getTime() - 1) });
    await expect(useCase.execute(token, 'Abc12345')).rejects.toMatchObject({ code: 'INVITATION_EXPIRED' });
    expect(activate).not.toHaveBeenCalled();
  });

  it.each([
    ['used', 'INVITATION_ALREADY_USED'],
    ['expired', 'INVITATION_EXPIRED'],
    ['email_in_use', 'INVITATION_EMAIL_IN_USE'],
    ['not_found', 'INVITATION_NOT_FOUND'],
  ] as const)('traduce el resultado %s del repositorio a %s', async (result, code) => {
    const { useCase } = build(invitation, result);
    await expect(useCase.execute(token, 'Abc12345')).rejects.toMatchObject({ code });
  });
});