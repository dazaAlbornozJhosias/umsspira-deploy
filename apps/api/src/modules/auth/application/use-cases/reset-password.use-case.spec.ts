import type { PasswordHasher } from '../ports/password-hasher.port';
import type { PasswordRecoveryRepository } from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { ResetPasswordUseCase } from './reset-password.use-case';

const NOW = new Date('2026-10-26T15:00:00Z');

function setup(outcome: unknown) {
  const repository = {
    reset: jest.fn().mockResolvedValue(outcome),
    recordEvent: jest.fn().mockResolvedValue(undefined),
  };
  const passwords = { hash: jest.fn().mockResolvedValue('argon2-hash') };
  const tokens = { fingerprint: jest.fn((value: string) => `hash(${value})`) };
  const useCase = new ResetPasswordUseCase(
    repository as unknown as PasswordRecoveryRepository,
    passwords as unknown as PasswordHasher,
    tokens as unknown as TokenService,
    () => NOW,
  );
  return { repository, passwords, useCase };
}

describe('ResetPasswordUseCase', () => {
  it('cambia la contraseña guardando solo su hash y el del enlace (CA-12.3, CA-12.4)', async () => {
    const { repository, passwords, useCase } = setup({ status: 'reset', userId: 'user-1' });

    await expect(useCase.execute('abc', 'Nueva-clave-1')).resolves.toBeUndefined();

    expect(passwords.hash).toHaveBeenCalledWith('Nueva-clave-1');
    expect(repository.reset).toHaveBeenCalledWith({
      tokenHash: 'hash(abc)',
      passwordHash: 'argon2-hash',
      now: NOW,
    });
    expect(JSON.stringify(repository.reset.mock.calls)).not.toContain('Nueva-clave-1');
    expect(repository.recordEvent).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 'expired', userId: 'user-1' }, 'RECOVERY_LINK_EXPIRED', 'enlace_vencido'],
    [{ status: 'used', userId: 'user-1' }, 'RECOVERY_LINK_USED', 'enlace_reutilizado'],
    [{ status: 'revoked', userId: 'user-1' }, 'RECOVERY_LINK_REPLACED', undefined],
    [{ status: 'invalid' }, 'RECOVERY_LINK_INVALID', undefined],
  ])('rechaza un enlace que no sirve (%j) (CA-12.5)', async (outcome, code, event) => {
    const { repository, useCase } = setup(outcome);

    await expect(useCase.execute('abc', 'Nueva-clave-1')).rejects.toMatchObject({ code });

    if (event) {
      expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ type: event }));
    } else {
      expect(repository.recordEvent).not.toHaveBeenCalled();
    }
  });
});