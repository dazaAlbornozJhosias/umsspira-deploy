import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import type { Environment } from '../src/config/environment';
import type { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { NodeRegistrationSecurity } from '../src/modules/registrations/infrastructure/security/registration-security';
import { PrismaCompanyMemberInvitationRepository } from '../src/modules/companies/infrastructure/repositories/prisma-company-member-invitation.repository';
import { PrismaCompanyInvitationRepository } from '../src/modules/companies/infrastructure/repositories/prisma-company-invitation.repository';
import { InviteCompanyMemberUseCase } from '../src/modules/companies/application/use-cases/invite-company-member.use-case';
import { buildCompanyInvitationEmail } from '../src/modules/companies/infrastructure/notifications/company-invitation-email';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { hashInvitationToken } from '../src/modules/companies/application/security/invitation-token';

const rawUrl = process.env.EPIC4_TEST_DATABASE_URL;
if (!rawUrl) {
  throw new Error('Falta EPIC4_TEST_DATABASE_URL para la copia local de pruebas.');
}
const target = new URL(rawUrl);
if (
  target.hostname !== '127.0.0.1' ||
  target.port !== '55447' ||
  !/^\/epic4_migration_test_\d+$/.test(target.pathname)
) {
  throw new Error('Solo se permite la copia temporal local de Epic 4.');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: rawUrl, max: 4 }),
  transactionOptions: { maxWait: 10000, timeout: 15000 },
});
const security = new NodeRegistrationSecurity({
  get: () => 'clave-exclusiva-de-pruebas-epic4'.repeat(3),
} as unknown as ConfigService<Environment, true>);
const repository = new PrismaCompanyMemberInvitationRepository(prisma as PrismaService, security);
const activations = new PrismaCompanyInvitationRepository(prisma as PrismaService, security);
const now = new Date('2026-10-30T12:00:00Z');
const useCase = new InviteCompanyMemberUseCase(
  repository,
  buildCompanyInvitationEmail,
  'https://web.test',
  () => now,
);
let owner: string;
let company: string;
let email: string;
let actor: ActorContext;
let startingMailIds: Set<string>;

describe('Invitaciones empresariales con PostgreSQL real y cola cifrada', () => {
  jest.setTimeout(30000);
  beforeAll(async () => prisma.$connect());
  afterAll(async () => prisma.$disconnect());
  beforeEach(async () => {
    owner = (
      await prisma.usuario.create({
        data: { nombre: 'Dueño temporal Epic 4', rol: 'empresa', estado: 'ACTIVO' },
      })
    ).usuario_id;
    company = (
      await prisma.empresa.create({
        data: { id_usuario: owner, razon_social: 'Empresa temporal Epic 4' },
      })
    ).id;
    email = `${randomUUID()}@example.test`;
    actor = { id: owner, role: 'empresa', scopes: { companyIds: [company] } } as ActorContext;
    startingMailIds = new Set(
      (await prisma.correoPendiente.findMany({ select: { id: true } })).map((r) => r.id),
    );
  });
  afterEach(async () => {
    await prisma.correoPendiente.deleteMany({ where: { id: { notIn: [...startingMailIds] } } });
    await prisma.empresaInvitacion.deleteMany({ where: { id_empresa: company } });
    await prisma.empresaUsuario.deleteMany({ where: { id_empresa: company } });
    await prisma.empresa.delete({ where: { id: company } });
    await prisma.cuentaAcceso.deleteMany({ where: { usuario: { correo: email } } });
    await prisma.usuario.deleteMany({ where: { OR: [{ usuario_id: owner }, { correo: email }] } });
  });
  const invite = () =>
    useCase.execute(actor, company, {
      nombre: 'Persona Invitada',
      correo: email,
      rol: 'Reclutador',
    });
  const mails = () =>
    prisma.correoPendiente.findMany({ where: { id: { notIn: [...startingMailIds] } } });
  async function expired() {
    return prisma.empresaInvitacion.create({
      data: {
        id_empresa: company,
        correo: email,
        nombre: 'Anterior',
        rol: 'reclutador',
        token_hash: randomUUID(),
        creado_por: owner,
        creado_en: new Date('2026-10-01T12:00:00Z'),
        expira_en: new Date('2026-10-02T12:00:00Z'),
      },
    });
  }

  it('crea correo cifrado con token válido y activa la cuenta con nombre y membresía correctos', async () => {
    const result = await invite();
    const saved = await prisma.empresaInvitacion.findUniqueOrThrow({ where: { id: result.id } });
    const outbox = await mails();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].contenido).not.toContain(email);
    const mail = security.open(outbox[0].contenido) as { to: string; text: string; html: string };
    expect(mail.to).toBe(email);
    const token = mail.text.match(/company-invitation\/([A-Za-z0-9_-]{43})/)?.[1];
    expect(token).toBeDefined();
    expect(saved.token_hash).toBe(hashInvitationToken(token!));
    expect(saved.token_hash).not.toBe(token);
    const passwordHash = await new Argon2PasswordHasher().hash('ContraseñaTemporal123');
    expect(await activations.activate({ tokenHash: saved.token_hash, passwordHash, now })).toBe(
      'activated',
    );
    const user = await prisma.usuario.findUniqueOrThrow({
      where: { correo: email },
      include: { cuenta_acceso: true, empresa_usuario_registros: true },
    });
    expect(user.nombre).toBe('Persona Invitada');
    expect(user.rol).toBe('empresa');
    expect(user.cuenta_acceso?.password_hash).toBe(passwordHash);
    expect(user.empresa_usuario_registros[0]).toMatchObject({
      id_empresa: company,
      rol: 'reclutador',
      estado: 'activo',
    });
    expect((await prisma.empresa.findUniqueOrThrow({ where: { id: company } })).id_usuario).toBe(
      owner,
    );
    expect(await activations.activate({ tokenHash: saved.token_hash, passwordHash, now })).toBe(
      'used',
    );
  });

  it('cancela la invitación vencida y encola una nueva sin chocar con el índice parcial', async () => {
    const previous = await expired();
    await invite();
    expect(
      (await prisma.empresaInvitacion.findUniqueOrThrow({ where: { id: previous.id } })).estado,
    ).toBe('cancelada');
    expect(
      await prisma.empresaInvitacion.count({ where: { id_empresa: company, estado: 'pendiente' } }),
    ).toBe(1);
    expect(await mails()).toHaveLength(1);
    expect(
      await activations.activate({ tokenHash: previous.token_hash, passwordHash: 'unused', now }),
    ).toBe('not_found');
  });

  it('dos peticiones simultáneas producen una invitación y un correo', async () => {
    const outcomes = await Promise.allSettled([invite(), invite()]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: 'COMPANY_MEMBER_INVITATION_CONFLICT' });
    expect(await prisma.empresaInvitacion.count({ where: { id_empresa: company } })).toBe(1);
    expect(await mails()).toHaveLength(1);
  });

  it('conserva el nombre al reenviar mediante el flujo compartido', async () => {
    const previous = await expired();
    const replaced = await activations.replaceInvitation({
      previousId: previous.id,
      companyId: company,
      email,
      role: 'reclutador',
      tokenHash: randomUUID(),
      createdBy: owner,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 86400000),
      mail: { to: email, subject: 'Reenvío', text: 'Enlace temporal' },
    });
    expect(replaced).not.toBeNull();
    expect(
      (await prisma.empresaInvitacion.findUniqueOrThrow({ where: { id: replaced!.invitationId } }))
        .nombre,
    ).toBe('Anterior');
  });

  it('rechaza correos con una cuenta existente sin crear invitación ni correo', async () => {
    await prisma.usuario.create({ data: { correo: email, rol: 'titulado', estado: 'ACTIVO' } });
    await expect(invite()).rejects.toMatchObject({ code: 'INVITATION_EMAIL_IN_USE' });
    expect(await mails()).toHaveLength(0);
    expect(await prisma.empresaInvitacion.count({ where: { id_empresa: company } })).toBe(0);
  });

  it('revierte la invitación y la cancelación anterior si falla el cifrado de correo', async () => {
    const previous = await expired();
    const broken = new PrismaCompanyMemberInvitationRepository(
      prisma as PrismaService,
      {
        ...security,
        seal: () => {
          throw new Error('Fallo de cifrado simulado');
        },
      } as unknown as NodeRegistrationSecurity,
    );
    const operation = new InviteCompanyMemberUseCase(
      broken,
      buildCompanyInvitationEmail,
      'https://web.test',
      () => now,
    );
    await expect(
      operation.execute(actor, company, { nombre: 'Persona', correo: email, rol: 'Reclutador' }),
    ).rejects.toThrow('Fallo de cifrado simulado');
    expect(
      (await prisma.empresaInvitacion.findUniqueOrThrow({ where: { id: previous.id } })).estado,
    ).toBe('pendiente');
    expect(await prisma.empresaInvitacion.count({ where: { id_empresa: company } })).toBe(1);
    expect(await mails()).toHaveLength(0);
  });

  it('autoriza a un administrador activo que no es el propietario', async () => {
    await prisma.empresa.update({ where: { id: company }, data: { id_usuario: null } });
    await prisma.empresaUsuario.create({
      data: { id_empresa: company, id_usuario: owner, rol: 'administrador', estado: 'activo' },
    });
    expect((await invite()).id).toBeDefined();
    expect(await mails()).toHaveLength(1);
  });

  it.each(['reclutador', 'inactivo'] as const)('no autoriza una membresía %s', async (kind) => {
    await prisma.empresa.update({ where: { id: company }, data: { id_usuario: null } });
    await prisma.empresaUsuario.create({
      data: {
        id_empresa: company,
        id_usuario: owner,
        rol: kind === 'reclutador' ? 'reclutador' : 'administrador',
        estado: kind === 'inactivo' ? 'inactivo' : 'activo',
      },
    });
    await expect(invite()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await mails()).toHaveLength(0);
    expect(await prisma.empresaInvitacion.count({ where: { id_empresa: company } })).toBe(0);
  });
});
