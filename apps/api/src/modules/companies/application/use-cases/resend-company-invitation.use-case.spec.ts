import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CompanyInvitation } from '../../domain/entities/company-invitation.entity';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { hashInvitationToken } from '../security/invitation-token';
import { ResendCompanyInvitationUseCase } from './resend-company-invitation.use-case';

const now = new Date('2026-10-29T12:00:00Z');
const actor = { id: 'admin-id', role: 'administrador' } as ActorContext;

const expired: CompanyInvitation = {
  id: 'inv-1',
  companyId: 'empresa-1',
  companyName: 'TechSolutions',
  email: 'rrhh@empresa.com',
  role: 'reclutador',
  status: 'pendiente',
  expiresAt: new Date('2026-10-20T12:00:00Z'),
  acceptedAt: null,
};

function build({
  invitation = expired as CompanyInvitation | null,
  emailsWithAccount = [] as string[],
  replaced = { invitationId: 'inv-2' } as { invitationId: string } | null,
} = {}) {
  const repository = {
    findById: jest.fn().mockResolvedValue(invitation),
    findEmailsWithAccount: jest.fn().mockResolvedValue(emailsWithAccount),
    replaceInvitation: jest.fn().mockResolvedValue(replaced),
  };
  const composeMail = jest.fn().mockReturnValue({ subject: 'Asunto', text: 'Texto', html: '<p>Html</p>' });
  const useCase = new ResendCompanyInvitationUseCase(
    repository as unknown as CompanyInvitationRepository,
    composeMail,
    'http://web.test',
    () => now,
  );
  return { useCase, repository, composeMail };
}

describe('ResendCompanyInvitationUseCase', () => {
  it('reemplaza una invitación vencida por una nueva de 7 días', async () => {
    const { useCase, repository, composeMail } = build();
    const result = await useCase.execute(actor, 'inv-1');

    expect(result).toEqual({
      invitationId: 'inv-2',
      email: 'rrhh@empresa.com',
      role: 'reclutador',
      expiresAt: new Date('2026-11-05T12:00:00Z'),
    });
    const input = repository.replaceInvitation.mock.calls[0][0];
    expect(input).toMatchObject({ previousId: 'inv-1', companyId: 'empresa-1', createdBy: 'admin-id' });
    const token = composeMail.mock.calls[0][0].activationUrl.split('/').pop() as string;
    expect(input.tokenHash).toBe(hashInvitationToken(token));
  });

  it('rechaza una invitación ya aceptada', async () => {
    const { useCase, repository } = build({ invitation: { ...expired, status: 'aceptada', acceptedAt: now } });
    await expect(useCase.execute(actor, 'inv-1')).rejects.toMatchObject({ code: 'INVITATION_ALREADY_USED' });
    expect(repository.replaceInvitation).not.toHaveBeenCalled();
  });

  it('responde no encontrada si no existe o fue cancelada', async () => {
    await expect(build({ invitation: null }).useCase.execute(actor, 'x')).rejects.toMatchObject({
      code: 'INVITATION_NOT_FOUND',
    });
    await expect(
      build({ invitation: { ...expired, status: 'cancelada' } }).useCase.execute(actor, 'inv-1'),
    ).rejects.toMatchObject({ code: 'INVITATION_NOT_FOUND' });
  });

  it('rechaza el reenvío si el correo ya tiene cuenta', async () => {
    const { useCase } = build({ emailsWithAccount: ['rrhh@empresa.com'] });
    await expect(useCase.execute(actor, 'inv-1')).rejects.toMatchObject({ code: 'INVITATION_EMAIL_IN_USE' });
  });

  it('falla si otra petición ya cambió la invitación', async () => {
    const { useCase } = build({ replaced: null });
    await expect(useCase.execute(actor, 'inv-1')).rejects.toMatchObject({ code: 'INVITATION_ALREADY_USED' });
  });
});