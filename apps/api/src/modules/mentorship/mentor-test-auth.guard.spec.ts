import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedError } from '@/shared/errors';
import {
  LOCAL_MENTOR_TEST_TOKEN,
  LOCAL_MENTOR_TEST_USER_ID,
  MentorAuthGuard,
} from './mentor-test-auth.guard';

const mockGetUser = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  getSupabaseAuthClient: () => ({ auth: { getUser: mockGetUser } }),
}));

function contextWith(headers: Record<string, string>): ExecutionContext {
  const request: { headers: Record<string, string>; user?: { id?: string } } = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function requestOf(context: ExecutionContext): { user?: { id?: string } } {
  return (context.switchToHttp().getRequest as () => { user?: { id?: string } })();
}

describe('MentorAuthGuard', () => {
  const originalEnv = process.env;
  const guard = new MentorAuthGuard();

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockGetUser.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('acepta el token de prueba local fuera de producción', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_MENTOR_TEST_AUTH = 'true';

    const context = contextWith({ authorization: `Bearer ${LOCAL_MENTOR_TEST_TOKEN}` });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(requestOf(context).user?.id).toBe(LOCAL_MENTOR_TEST_USER_ID);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('no acepta el token de prueba en producción', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_MENTOR_TEST_AUTH = 'true';

    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    const context = contextWith({ authorization: `Bearer ${LOCAL_MENTOR_TEST_TOKEN}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('valida el token real del login y deja el id del usuario logueado', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_MENTOR_TEST_AUTH;

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'e9ec70d2-0123-47da-aca0-4bc55be094f4',
          email: 'titulado@umss.edu.bo',
          app_metadata: { role: 'titulado' },
        },
      },
      error: null,
    });
    const context = contextWith({ authorization: 'Bearer token-real-de-supabase' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith('token-real-de-supabase');
    expect(requestOf(context).user?.id).toBe('e9ec70d2-0123-47da-aca0-4bc55be094f4');
  });

  it('rechaza peticiones sin cabecera de autorización', async () => {
    process.env.NODE_ENV = 'production';

    const context = contextWith({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
