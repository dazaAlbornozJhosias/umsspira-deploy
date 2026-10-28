import { ActivationAccessService } from './activation-access.service';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { NodeRegistrationSecurity } from '../../infrastructure/security/registration-security';

jest.mock('../../../../shared/infrastructure/database/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../../infrastructure/security/registration-security', () => ({ NodeRegistrationSecurity: class {} }));

function setup(state = 'APROBADA', active: Date | null = null) {
  const row = { estado: state, activada_en: active, activacion_intentos: 0,
    activacion_expira_en: new Date('2026-10-25T20:00:00Z'), detalle_solicitud: { email: 'maria@example.com', nombre: 'Maria' } };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    solicitud: { findUnique: jest.fn().mockResolvedValue(row), update: jest.fn().mockResolvedValue({}) },
    controlReenvioOtp: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({}) },
    correoPendiente: { create: jest.fn().mockResolvedValue({}) },
    correoTramite: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = { ...tx, $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)) };
  const security = { code: () => '123456', hash: () => 'new-hash', seal: (mail: unknown) => JSON.stringify(mail) };
  return { tx, service: new ActivationAccessService(prisma as unknown as PrismaService, security as unknown as NodeRegistrationSecurity) };
}

describe('integración de activación pública', () => {
  it('devuelve el correo enmascarado real y la vigencia sin revelar el OTP', async () => {
    const { service } = setup();
    const result = await service.inspect('id');
    expect(result).toEqual({ maskedEmail: 'ma****@example.com', expiresAt: '2026-10-25T20:00:00.000Z', cooldownSeconds: 0, resendCount: 0, failedAttempts: 0 });
  });
  it('sustituye el OTP, reinicia fallos y encola el correo con 24 horas', async () => {
    const { service, tx } = setup();
    const result = await service.resend('id');
    expect(result).toMatchObject({ resendCount: 1, cooldownSeconds: 30, notificationStatus: 'EN_COLA' });
    expect(tx.solicitud.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ activacion_hash: 'new-hash', activacion_intentos: 0 }) }));
    const mail = JSON.parse(tx.correoPendiente.create.mock.calls[0][0].data.contenido);
    expect(mail.to).toBe('maria@example.com');
    expect(mail.text).toContain('123456');
    expect(mail.text).toContain('/activate?applicationId=id');
    expect(mail.text).toContain('24 horas');
    expect(tx.correoTramite.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tipo: 'otp', id_solicitud: 'id' }) }));
  });
  it.each(['PENDIENTE', 'OBSERVADA', 'RECHAZADA'])('no emite OTP para %s', async (state) => {
    const { service, tx } = setup(state);
    await expect(service.resend('id')).rejects.toMatchObject({ code: 'ACTIVATION_UNAVAILABLE' });
    expect(tx.correoPendiente.create).not.toHaveBeenCalled();
  });
  it('una cuenta activada debe iniciar sesión, no repetir la activación', async () => {
    const { service, tx } = setup('APROBADA', new Date());
    await expect(service.inspect('id')).rejects.toMatchObject({ code: 'ACTIVATION_ALREADY_DONE' });
    await expect(service.resend('id')).rejects.toMatchObject({ code: 'ACTIVATION_UNAVAILABLE' });
    expect(tx.solicitud.update).not.toHaveBeenCalled();
  });
});
