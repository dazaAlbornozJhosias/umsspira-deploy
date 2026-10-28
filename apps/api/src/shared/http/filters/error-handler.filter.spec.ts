import { ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { ErrorHandlerFilter } from './error-handler.filter';

describe('Respuestas de error centralizadas', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('uniforma el 404 sin reflejar detalles de la ruta', () => {
    new ErrorHandlerFilter().catch(new NotFoundException('Mensaje interno'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado' },
    });
  });

  it('traduce conflictos de Prisma sin divulgar índices ni consultas', () => {
    const error = new Prisma.PrismaClientKnownRequestError('SQL privado', {
      code: 'P2002',
      clientVersion: '7.10.1',
      meta: { target: ['dato_privado'] },
    });
    new ErrorHandlerFilter().catch(error, host);
    expect(status).toHaveBeenCalledWith(409);
    expect(JSON.stringify(json.mock.calls)).not.toContain('privado');
  });

  it('registra errores inesperados y devuelve un mensaje genérico', () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      new ErrorHandlerFilter().catch(new Error('contraseña-secreta'), host);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado' },
      });
      expect(log).toHaveBeenCalled();
      expect(JSON.stringify(log.mock.calls)).not.toContain('contraseña-secreta');
    } finally {
      log.mockRestore();
    }
  });
});
