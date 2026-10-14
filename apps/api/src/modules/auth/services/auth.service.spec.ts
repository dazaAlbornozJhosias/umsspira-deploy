import { Logger } from '@nestjs/common';
import { UnauthorizedError } from '../../../shared/errors';
import type { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const signInWithPassword = jest.fn();
  const service = new AuthService({ signInWithPassword } as unknown as AuthRepository);
  const input = { email: 'admin@example.com', password: 'secreto123' };

  function sessionFor(role?: string) {
    return {
      data: {
        session: { access_token: 'token-123' },
        user: { app_metadata: role ? { role } : {} },
      },
      error: null,
    };
  }

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    signInWithPassword.mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('devuelve el token y el rol de un administrador', async () => {
    signInWithPassword.mockResolvedValue(sessionFor('administrador'));
    await expect(service.login(input)).resolves.toEqual({
      accessToken: 'token-123',
      role: 'administrador',
    });
  });

  it('devuelve el token y el rol de un titulado', async () => {
    signInWithPassword.mockResolvedValue(sessionFor('titulado'));
    await expect(service.login(input)).resolves.toEqual({
      accessToken: 'token-123',
      role: 'titulado',
    });
  });

  it('devuelve el rol desde user_metadata cuando app_metadata no lo trae', async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        session: { access_token: 'token-123' },
        user: { app_metadata: { provider: 'email' }, user_metadata: { rol: 'titulado' } },
      },
      error: null,
    });
    await expect(service.login(input)).resolves.toEqual({
      accessToken: 'token-123',
      role: 'titulado',
    });
  });

  it('responde con el mensaje genérico si Supabase rechaza las credenciales (CA-05.4)', async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    await expect(service.login(input)).rejects.toThrow(
      new UnauthorizedError('Correo electrónico o contraseña incorrectos'),
    );
  });

  it('rechaza una cuenta sin rol', async () => {
    signInWithPassword.mockResolvedValue(sessionFor());
    await expect(service.login(input)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rechaza el rol antiguo "egresado"', async () => {
    signInWithPassword.mockResolvedValue(sessionFor('egresado'));
    await expect(service.login(input)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});