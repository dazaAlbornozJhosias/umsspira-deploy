import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MemberInvitationResult } from '../ports/company-member-invitation-repository.port';
import { hashInvitationToken } from '../security/invitation-token';
import { inviteCompanyMemberSchema } from '../../http/schemas/company-invitation.schemas';
import { InviteCompanyMemberUseCase } from './invite-company-member.use-case';

const actor = { id: 'owner', role: 'empresa', scopes: { companyIds: ['company'] } } as ActorContext;
const input = { nombre: ' Ana Prueba ', correo: ' ANA@EXAMPLE.TEST ', rol: 'Reclutador' as const };
const now = new Date('2026-10-30T12:00:00Z');
function build(result: MemberInvitationResult = { status: 'created', invitationId: 'invitation' }) {
  const repository = {
    findCompanyName: jest.fn().mockResolvedValue('Empresa'),
    create: jest.fn().mockResolvedValue(result),
  };
  const mail = jest
    .fn()
    .mockReturnValue({ subject: 'Invitación', text: 'Activar', html: '<p>Activar</p>' });
  return {
    repository,
    mail,
    useCase: new InviteCompanyMemberUseCase(repository, mail, 'https://web.test/', () => now),
  };
}

describe('Invitar colaboradores de una empresa', () => {
  it('mantiene el contrato HTTP y prepara el token de activación compartido', async () => {
    const { repository, mail, useCase } = build();
    expect(await useCase.execute(actor, 'company', input)).toEqual({
      id: 'invitation',
      id_usuario: null,
      nombre: 'Ana Prueba',
      correo: 'ana@example.test',
      rol: 'Reclutador',
      estado: 'Pendiente',
      esTitular: false,
    });
    const token = mail.mock.calls[0][0].activationUrl.split('/').pop();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Prueba',
        email: 'ana@example.test',
        role: 'reclutador',
        actorId: 'owner',
        tokenHash: hashInvitationToken(token),
        createdAt: now,
        expiresAt: new Date('2026-11-06T12:00:00Z'),
        mail: {
          to: 'ana@example.test',
          subject: 'Invitación',
          text: 'Activar',
          html: '<p>Activar</p>',
        },
      }),
    );
    expect(mail.mock.calls[0][0].activationUrl).toBe(
      `https://web.test/company-invitation/${token}`,
    );
  });

  it.each(['titulado', 'administrador'])('no permite invitar con rol global %s', async (role) => {
    const { repository, useCase } = build();
    await expect(
      useCase.execute({ ...actor, role } as ActorContext, 'company', input),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(repository.findCompanyName).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('no permite invitar para otra empresa', async () => {
    const { repository, useCase } = build();
    await expect(useCase.execute(actor, 'foreign', input)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['forbidden', 'FORBIDDEN'],
    ['company_not_found', 'COMPANY_NOT_FOUND'],
    ['email_in_use', 'INVITATION_EMAIL_IN_USE'],
    ['already_member', 'COMPANY_MEMBER_INVITATION_CONFLICT'],
    ['pending', 'COMPANY_MEMBER_INVITATION_CONFLICT'],
  ] as const)('traduce %s a un error de aplicación', async (status, code) => {
    const { useCase } = build({ status });
    await expect(useCase.execute(actor, 'company', input)).rejects.toMatchObject({ code });
  });

  it('no prepara correos si la empresa no existe', async () => {
    const { repository, mail, useCase } = build();
    repository.findCompanyName.mockResolvedValue(null);
    await expect(useCase.execute(actor, 'company', input)).rejects.toMatchObject({
      code: 'COMPANY_NOT_FOUND',
    });
    expect(mail).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, nombre: 'A'.repeat(121) },
    { ...input, correo: 'invalido' },
    { ...input, rol: 'titulado' },
    { ...input, nombre: null },
    { ...input, extra: true },
  ])('rechaza datos incompatibles con el contrato de invitación', (invalid) => {
    expect(inviteCompanyMemberSchema.safeParse(invalid).success).toBe(false);
  });
});
