import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedError } from '../errors';
import { AuthGuard } from './auth.guard';

const mockGetUser = jest.fn();

jest.mock('../lib/supabase', () => ({
  getSupabaseAuthClient: () => ({ auth: { getUser: mockGetUser } }),
}));

function contextWith(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const guard = new AuthGuard();

  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it('rechaza una petición sin cabecera de autorización', async () => {
    const context = contextWith({ headers: {} });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('rechaza un esquema distinto de Bearer', async () => {
    const context = contextWith({ headers: { authorization: 'Basic abc' } });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('rechaza un token que Supabase no reconoce', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    const context = contextWith({ headers: { authorization: 'Bearer token-invalido' } });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rechaza un usuario sin un rol válido', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@example.com', app_metadata: { role: 'egresado' } } },
      error: null,
    });
    const context = contextWith({ headers: { authorization: 'Bearer token-valido' } });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('acepta un token válido y deja el usuario en la petición', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'admin@example.com', app_metadata: { role: 'administrador' } },
      },
      error: null,
    });
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer token-valido' },
    };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith('token-valido');
    expect(request.user).toEqual({ id: 'u1', email: 'admin@example.com', role: 'administrador' });
  });

  it('resuelve el rol desde user_metadata cuando app_metadata no lo trae', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u2',
          email: 'titulado@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: { rol: 'titulado' },
        },
      },
      error: null,
    });
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer token-valido' },
    };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u2', email: 'titulado@example.com', role: 'titulado' });
  });
});