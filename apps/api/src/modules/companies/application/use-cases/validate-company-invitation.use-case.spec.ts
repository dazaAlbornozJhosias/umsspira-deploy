import type { CompanyInvitation } from '../../domain/entities/company-invitation.entity';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { hashInvitationToken } from '../security/invitation-token';
import { ValidateCompanyInvitationUseCase } from './validate-company-invitation.use-case';

const token = 'A'.repeat(43);
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

function build(found: CompanyInvitation | null) {
  const findByTokenHash = jest.fn().mockResolvedValue(found);
  const repository = { findByTokenHash, activate: jest.fn() } as unknown as CompanyInvitationRepository;
  return { findByTokenHash, useCase: new ValidateCompanyInvitationUseCase(repository, () => now) };
}

describe('ValidateCompanyInvitationUseCase', () => {
  it('devuelve la empresa y el correo enmascarado si la invitación está vigente', async () => {
    const { useCase, findByTokenHash } = build(invitation);
    await expect(useCase.execute(token)).resolves.toEqual({
      companyName: 'TechSolutions S.A.',
      email: 'co***@techsolutions.com',
      expiresAt: invitation.expiresAt,
    });
    expect(findByTokenHash).toHaveBeenCalledWith(hashInvitationToken(token));
  });

  it.each(['', 'corto', 'A'.repeat(44), 'A'.repeat(42) + '*'])(
    'rechaza el formato %p sin consultar la base',
    async (invalidToken) => {
      const { useCase, findByTokenHash } = build(invitation);
      await expect(useCase.execute(invalidToken)).rejects.toMatchObject({ code: 'INVITATION_TOKEN_INVALID' });
      expect(findByTokenHash).not.toHaveBeenCalled();
    },
  );

  it('rechaza un token alterado que no corresponde a ninguna invitación', async () => {
    const { useCase } = build(null);
    await expect(useCase.execute(token)).rejects.toMatchObject({ code: 'INVITATION_NOT_FOUND' });
  });

  it('rechaza una invitación vencida por fecha aunque siga pendiente', async () => {
    const { useCase } = build({ ...invitation, expiresAt: new Date(now.getTime() - 1) });
    await expect(useCase.execute(token)).rejects.toMatchObject({ code: 'INVITATION_EXPIRED' });
  });

  it('rechaza una invitación ya aceptada', async () => {
    const { useCase } = build({ ...invitation, status: 'aceptada', acceptedAt: now });
    await expect(useCase.execute(token)).rejects.toMatchObject({ code: 'INVITATION_ALREADY_USED' });
  });

  it('trata una invitación cancelada como inexistente', async () => {
    const { useCase } = build({ ...invitation, status: 'cancelada' });
    await expect(useCase.execute(token)).rejects.toMatchObject({ code: 'INVITATION_NOT_FOUND' });
  });
});