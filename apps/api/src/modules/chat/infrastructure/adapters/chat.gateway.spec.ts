import { ConfigService } from '@nestjs/config';
import type { Namespace, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import type { Authenticator } from '../../../../shared/security/ports/authenticator.port';

describe('Autenticación de suscripciones de chat', () => {
  const auth: Authenticator = { execute: jest.fn() };
  const actor = { id: 'user-1', email: 'user@example.test', name: 'Ana', role: 'titulado' as const,
    permissions: ['user:self:read'], scopes: { companyIds: [], graduateId: null, careerIds: [] }, credentialVersion: 1 };
  let gateway: ChatGateway;
  let middleware: Parameters<Namespace['use']>[0];
  beforeEach(() => {
    jest.mocked(auth.execute).mockReset().mockResolvedValue({ actor, sessionId: 'session' });
    gateway = new ChatGateway(auth, new ConfigService());
    gateway.afterInit({ use: (handler: typeof middleware) => { middleware = handler; } } as Namespace);
  });
  const client = (token?: string, origin = 'http://localhost:3001') => ({
    handshake: { auth: token ? { token } : {}, headers: { origin } }, data: {},
  }) as Socket;
  it('rechaza conexiones sin token aunque el navegador tenga cookies', async () => {
    const next = jest.fn();
    await middleware(client(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ data: { code: 'UNAUTHENTICATED' } }));
    expect(auth.execute).not.toHaveBeenCalled();
  });
  it('autentica antes de aceptar el namespace', async () => {
    const socket = client('access-token'), next = jest.fn();
    await middleware(socket, next);
    expect(auth.execute).toHaveBeenCalledWith('access-token');
    expect(socket.data.userId).toBe('user-1'); expect(next).toHaveBeenCalledWith();
  });
  it('rechaza orígenes no permitidos y sesiones revocadas', async () => {
    const next = jest.fn();
    await middleware(client('token', 'https://otro.example.test'), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    jest.mocked(auth.execute).mockRejectedValue(new Error('revocada'));
    next.mockClear(); await middleware(client('token'), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
