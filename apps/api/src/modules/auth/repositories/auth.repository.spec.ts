import { AuthRepository } from './auth.repository';

const mockSignIn = jest.fn();
const mockDbFrom = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  getSupabaseAuthClient: () => ({ auth: { signInWithPassword: mockSignIn } }),
  // Si el login tocara el cliente de la BD, la sesión del usuario se adjuntaría
  // a las consultas siguientes y la BD se leería con RLS del usuario.
  getSupabaseClient: () => ({ from: mockDbFrom }),
}));

describe('AuthRepository', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockDbFrom.mockReset();
  });

  it('inicia sesión con el cliente dedicado a autenticación', async () => {
    mockSignIn.mockResolvedValue({
      data: { session: { access_token: 'token-123' }, user: { id: 'u1' } },
      error: null,
    });

    const repo = new AuthRepository();
    await expect(repo.signInWithPassword('a@example.com', 'secreto123')).resolves.toEqual({
      data: { session: { access_token: 'token-123' }, user: { id: 'u1' } },
      error: null,
    });
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@example.com', password: 'secreto123' });
  });

  it('nunca usa el cliente compartido de la base de datos', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'invalid' } });

    const repo = new AuthRepository();
    await repo.signInWithPassword('a@example.com', 'mala');

    expect(mockDbFrom).not.toHaveBeenCalled();
  });
});
