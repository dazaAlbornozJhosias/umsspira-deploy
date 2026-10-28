import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import { createTransport } from 'nodemailer';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { NodeRegistrationSecurity } from '../security/registration-security';
import { SmtpOutboxWorker } from './smtp-outbox.worker';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('Entrega de notificaciones persistidas', () => {
  const config = new ConfigService<Environment, true>({
    NODE_ENV: 'development',
    AUTH_JWT_SECRET: 'solo-pruebas'.repeat(10),
  });
  const security = new NodeRegistrationSecurity(config);
  const sendMail = jest.fn();
  const database = {
    correoPendiente: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    borradorRegistro: { deleteMany: jest.fn() },
  };
  let worker: SmtpOutboxWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({ sendMail, close: jest.fn() });
    database.correoPendiente.findMany.mockResolvedValue([
      {
        id: 'correo-de-prueba',
        contenido: security.seal({
          to: 'test@example.com',
          subject: 'Verificación',
          text: 'Código 123456',
        }),
      },
    ]);
    database.correoPendiente.updateMany.mockResolvedValue({ count: 1 });
    sendMail.mockResolvedValue({ messageId: 'correo-de-prueba' });
    worker = new SmtpOutboxWorker(database as unknown as PrismaService, security, config);
    jest.spyOn(config, 'get').mockReturnValueOnce('development');
    worker.onModuleInit();
  });

  afterEach(async () => worker.onModuleDestroy());

  it('entrega por SMTP y elimina el contenido cifrado después de confirmar', async () => {
    await worker.drain();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', text: 'Código 123456' }),
    );
    expect(database.correoPendiente.update).toHaveBeenCalledWith({
      where: { id: 'correo-de-prueba' },
      data: { enviado_en: expect.any(Date), contenido: '' },
    });
  });

  it('conserva el mensaje pendiente cuando falla SMTP', async () => {
    sendMail.mockRejectedValue(new Error('SMTP temporalmente fuera de servicio'));
    await worker.drain();
    expect(database.correoPendiente.update).not.toHaveBeenCalled();
    expect(database.correoPendiente.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { proximo_en: expect.any(Date), intentos: { increment: 1 } },
      }),
    );
  });

  it('no entrega un mensaje reservado por otro worker', async () => {
    database.correoPendiente.updateMany.mockResolvedValue({ count: 0 });
    await worker.drain();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
