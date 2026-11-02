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
  const expiresAt = new Date('2030-01-01T00:00:00Z');
  const database = {
    correoPendiente: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    correoTramite: { findFirst: jest.fn(), update: jest.fn() },
    borradorRegistro: { deleteMany: jest.fn() },
  };
  let worker: SmtpOutboxWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    (createTransport as jest.Mock).mockReturnValue({ sendMail, close: jest.fn() });
    database.correoPendiente.findMany.mockResolvedValue([
      {
        id: 'correo-de-prueba',
        expira_en: expiresAt,
        contenido: security.seal({
          to: 'test@example.com',
          subject: 'Verificación',
          text: 'Código 123456',
        }),
      },
    ]);
    database.correoPendiente.updateMany.mockResolvedValue({ count: 1 });
    database.correoTramite.findFirst.mockResolvedValue(null);
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

  it('envía también la versión HTML cuando el mensaje la trae', async () => {
    database.correoPendiente.findMany.mockResolvedValue([
      {
        id: 'correo-de-prueba',
        expira_en: expiresAt,
        contenido: security.seal({
          to: 'test@example.com',
          subject: 'Aprobada',
          text: 'Hola',
          html: '<p>Hola</p>',
        }),
      },
    ]);
    await worker.drain();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hola', html: '<p>Hola</p>' }),
    );
  });

  it('marca el seguimiento como enviado y cuenta el intento', async () => {
    database.correoTramite.findFirst.mockResolvedValue({
      id: 'seguimiento-1',
      intentos: 0,
      max_intentos: 3,
    });
    await worker.drain();
    expect(database.correoTramite.update).toHaveBeenCalledWith({
      where: { id: 'seguimiento-1' },
      data: expect.objectContaining({ estado: 'enviada', intentos: 1, ultimo_error: null }),
    });
  });

  it('conserva el mensaje pendiente cuando falla SMTP y no tiene seguimiento', async () => {
    sendMail.mockRejectedValue(new Error('SMTP temporalmente fuera de servicio'));
    await worker.drain();
    expect(database.correoPendiente.update).not.toHaveBeenCalled();
    expect(database.correoTramite.update).not.toHaveBeenCalled();
    expect(database.correoPendiente.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { proximo_en: expect.any(Date), intentos: { increment: 1 } },
      }),
    );
  });

  it('registra el fallo y reprograma el siguiente intento', async () => {
    sendMail.mockRejectedValue(new Error('SMTP temporalmente fuera de servicio'));
    database.correoTramite.findFirst.mockResolvedValue({
      id: 'seguimiento-1',
      intentos: 0,
      max_intentos: 3,
    });
    await worker.drain();
    expect(database.correoTramite.update).toHaveBeenCalledWith({
      where: { id: 'seguimiento-1' },
      data: expect.objectContaining({
        estado: 'pendiente',
        intentos: 1,
        ultimo_error: 'SMTP temporalmente fuera de servicio',
        siguiente_intento_en: expect.any(Date),
      }),
    });
    expect(database.correoPendiente.update).toHaveBeenCalledWith({
      where: { id: 'correo-de-prueba' },
      data: { proximo_en: expect.any(Date) },
    });
  });

  it('marca el correo como fallido y lo estaciona al agotar los intentos', async () => {
    sendMail.mockRejectedValue(new Error('SMTP temporalmente fuera de servicio'));
    database.correoTramite.findFirst.mockResolvedValue({
      id: 'seguimiento-1',
      intentos: 2,
      max_intentos: 3,
    });
    await worker.drain();
    expect(database.correoTramite.update).toHaveBeenCalledWith({
      where: { id: 'seguimiento-1' },
      data: expect.objectContaining({ estado: 'fallida', intentos: 3 }),
    });
    expect(database.correoPendiente.update).toHaveBeenCalledWith({
      where: { id: 'correo-de-prueba' },
      data: { proximo_en: expiresAt },
    });
  });

  it('no entrega un mensaje reservado por otro worker', async () => {
    database.correoPendiente.updateMany.mockResolvedValue({ count: 0 });
    await worker.drain();
    expect(sendMail).not.toHaveBeenCalled();
  });
});