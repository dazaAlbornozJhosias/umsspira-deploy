import { PrismaPasswordRecoveryRepository } from './prisma-password-recovery.repository';

// El repositorio solo usa PrismaService como tipo del constructor; se evita cargar el cliente generado.
jest.mock('../../../../shared/infrastructure/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

const NOW = new Date('2026-10-26T15:00:00Z');
const EXPIRES = new Date('2026-10-26T16:00:00Z');

function createRepository() {
  const tx = {
    passwordResetToken: { updateMany: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    passwordResetCorreo: { create: jest.fn() },
    passwordResetEvento: { create: jest.fn() },
    passwordResetSolicitud: { count: jest.fn(), create: jest.fn() },
    cuentaAcceso: { findUnique: jest.fn(), update: jest.fn() },
    sesionAcceso: { updateMany: jest.fn() },
    $queryRaw: jest.fn(),
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((work: unknown) =>
      typeof work === 'function' ? (work as (client: typeof tx) => unknown)(tx) : Promise.all(work as unknown[]),
    ),
  };
  return { tx, prisma, repository: new PrismaPasswordRecoveryRepository(prisma as never) };
}

const issueInput = {
  userId: 'user-1',
  email: 'admin@umss.edu.bo',
  tokenHash: 'hash',
  expiresAt: EXPIRES,
  subject: 'Asunto',
  body: 'Cuerpo con enlace',
  now: NOW,
};

describe('PrismaPasswordRecoveryRepository', () => {
  describe('countRecentRequests (CA-12.2)', () => {
    it('cuenta por correo y por origen sin contar las rechazadas por límite', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetSolicitud.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      const counts = await repository.countRecentRequests('admin@umss.edu.bo', 'origen', new Date('2026-10-26T14:00:00Z'));

      expect(counts).toEqual({ byEmail: 2, byOrigin: 1 });
      const [byEmail, byOrigin] = tx.passwordResetSolicitud.count.mock.calls.map(([args]) => args.where);
      expect(byEmail).toMatchObject({
        correo_normalizado: 'admin@umss.edu.bo',
        resultado: { not: 'rechazado_rate' },
        creado_en: { gte: new Date('2026-10-26T14:00:00Z') },
      });
      expect(byOrigin).toMatchObject({ origen_hash: 'origen', resultado: { not: 'rechazado_rate' } });
    });
  });

  describe('issue (CA-12.1, CA-12.3)', () => {
    it('crea el enlace y encola el correo con el mismo reloj para la vigencia', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      tx.passwordResetToken.create.mockResolvedValue({ id: 'token-1' });

      await expect(repository.issue(issueInput)).resolves.toBe(true);

      expect(tx.passwordResetToken.create).toHaveBeenCalledWith({
        data: { id_usuario: 'user-1', token_hash: 'hash', expira_en: EXPIRES, creado_en: NOW },
      });
      expect(tx.passwordResetCorreo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_token: 'token-1',
          email_destino: 'admin@umss.edu.bo',
          asunto: 'Asunto',
          cuerpo: 'Cuerpo con enlace',
          siguiente_intento_en: NOW,
        }),
      });
      const events = tx.passwordResetEvento.create.mock.calls.map(([args]) => args.data.tipo);
      expect(events).toEqual(['solicitud']);
    });

    it('revoca el enlace activo anterior antes de crear el nuevo y lo registra', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      tx.passwordResetToken.create.mockResolvedValue({ id: 'token-2' });

      await repository.issue(issueInput);

      expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { id_usuario: 'user-1', usado_en: null, revocado: false },
        data: { revocado: true },
      });
      expect(tx.passwordResetToken.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        tx.passwordResetToken.create.mock.invocationCallOrder[0],
      );
      const events = tx.passwordResetEvento.create.mock.calls.map(([args]) => args.data.tipo);
      expect(events).toEqual(['enlace_revocado', 'solicitud']);
    });

    it('devuelve false si otra solicitud simultánea ya creó el enlace activo', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      tx.passwordResetToken.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));

      await expect(repository.issue(issueInput)).resolves.toBe(false);
    });

    it('no oculta otros errores de la base de datos', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.updateMany.mockRejectedValue(new Error('conexión perdida'));

      await expect(repository.issue(issueInput)).rejects.toThrow('conexión perdida');
    });
  });

  describe('reset (CA-12.3, CA-12.4, CA-12.5)', () => {
    const lockedToken = (overrides = {}) => ({
      id: 'token-1',
      id_usuario: 'user-1',
      expira_en: EXPIRES,
      usado_en: null,
      revocado: false,
      ...overrides,
    });
    const input = { tokenHash: 'hash', passwordHash: 'nuevo-hash', now: NOW };

    it('cambia la contraseña, cierra todas las sesiones y consume el enlace en una transacción', async () => {
      const { prisma, tx, repository } = createRepository();
      tx.$queryRaw.mockResolvedValueOnce([lockedToken()]).mockResolvedValueOnce([]);
      tx.cuentaAcceso.findUnique.mockResolvedValue({ usuario: { estado: 'ACTIVO', correo: 'admin@umss.edu.bo' } });

      await expect(repository.reset(input)).resolves.toEqual({ status: 'reset', userId: 'user-1' });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.cuentaAcceso.update).toHaveBeenCalledWith({
        where: { id_usuario: 'user-1' },
        data: { password_hash: 'nuevo-hash', version: { increment: 1 }, actualizada_en: NOW },
      });
      expect(tx.sesionAcceso.updateMany).toHaveBeenCalledWith({
        where: { id_usuario: 'user-1', revocada_en: null },
        data: { revocada_en: NOW, motivo_revocacion: 'recuperacion_password' },
      });
      expect(tx.passwordResetToken.update).toHaveBeenCalledWith({ where: { id: 'token-1' }, data: { usado_en: NOW } });
      expect(tx.passwordResetEvento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tipo: 'password_cambiada', usuario_id: 'user-1' }),
      });
    });

    it.each([
      ['vencido', { expira_en: new Date('2026-10-26T14:59:59Z') }, 'expired'],
      ['usado', { usado_en: new Date('2026-10-26T14:30:00Z') }, 'used'],
      ['reemplazado', { revocado: true }, 'revoked'],
    ])('no cambia nada si el enlace está %s', async (_label, overrides, status) => {
      const { tx, repository } = createRepository();
      tx.$queryRaw.mockResolvedValueOnce([lockedToken(overrides)]);

      await expect(repository.reset(input)).resolves.toEqual({ status, userId: 'user-1' });

      expect(tx.cuentaAcceso.update).not.toHaveBeenCalled();
      expect(tx.sesionAcceso.updateMany).not.toHaveBeenCalled();
      expect(tx.passwordResetToken.update).not.toHaveBeenCalled();
    });

    it('un enlace inexistente se informa como inválido', async () => {
      const { tx, repository } = createRepository();
      tx.$queryRaw.mockResolvedValueOnce([]);

      await expect(repository.reset(input)).resolves.toEqual({ status: 'invalid' });
      expect(tx.cuentaAcceso.update).not.toHaveBeenCalled();
    });

    it('no restablece la contraseña de una cuenta que ya no está activa', async () => {
      const { tx, repository } = createRepository();
      tx.$queryRaw.mockResolvedValueOnce([lockedToken()]).mockResolvedValueOnce([]);
      tx.cuentaAcceso.findUnique.mockResolvedValue({ usuario: { estado: 'BLOQUEADO', correo: 'a@b.co' } });

      await expect(repository.reset(input)).resolves.toEqual({ status: 'invalid' });
      expect(tx.cuentaAcceso.update).not.toHaveBeenCalled();
      expect(tx.passwordResetToken.update).not.toHaveBeenCalled();
    });
  });

  describe('findByHash', () => {
    it('traduce la fila al registro del dominio', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        id_usuario: 'user-1',
        expira_en: EXPIRES,
        usado_en: null,
        revocado: false,
      });

      await expect(repository.findByHash('hash')).resolves.toEqual({
        id: 'token-1',
        userId: 'user-1',
        expiresAt: EXPIRES,
        usedAt: null,
        revoked: false,
      });
    });

    it('devuelve null si no existe', async () => {
      const { tx, repository } = createRepository();
      tx.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(repository.findByHash('hash')).resolves.toBeNull();
    });
  });
});