import type { PasswordRecoveryRepository } from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { ValidatePasswordRecoveryLinkUseCase } from './validate-password-recovery-link.use-case';

const NOW = new Date('2026-10-26T15:00:00Z');
const minutes = (value: number) => new Date(NOW.getTime() + value * 60_000);

function setup(record: unknown) {
  const repository = {
    findByHash: jest.fn().mockResolvedValue(record),
    recordEvent: jest.fn().mockResolvedValue(undefined),
  };
  const tokens = { fingerprint: jest.fn((value: string) => `hash(${value})`) };
  const useCase = new ValidatePasswordRecoveryLinkUseCase(
    repository as unknown as PasswordRecoveryRepository,
    tokens as unknown as TokenService,
    () => NOW,
  );
  return { repository, useCase };
}

const link = (overrides = {}) => ({
  id: 'token-1',
  userId: 'user-1',
  expiresAt: minutes(30),
  usedAt: null,
  revoked: false,
  ...overrides,
});

describe('ValidatePasswordRecoveryLinkUseCase', () => {
  it('acepta un enlace vigente y registra que se abrió (CA-12.3)', async () => {
    const { repository, useCase } = setup(link());

    await expect(useCase.execute('abc')).resolves.toBeUndefined();

    expect(repository.findByHash).toHaveBeenCalledWith('hash(abc)');
    expect(repository.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'enlace_abierto', userId: 'user-1' }),
    );
  });

  it('un enlace inexistente o mal formado responde como inválido (CA-12.5)', async () => {
    const { useCase } = setup(null);

    await expect(useCase.execute('abc')).rejects.toMatchObject({
      code: 'RECOVERY_LINK_INVALID',
      reason: 'invalid',
    });
  });

  it('un enlace vencido responde 410 con su propio código (CA-12.5)', async () => {
    const { repository, useCase } = setup(link({ expiresAt: minutes(-1) }));

    await expect(useCase.execute('abc')).rejects.toMatchObject({
      code: 'RECOVERY_LINK_EXPIRED',
      reason: 'expired',
    });
    expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'enlace_vencido' }));
  });

  it('un enlace ya usado responde 409 con su propio código (CA-12.5)', async () => {
    const { repository, useCase } = setup(link({ usedAt: minutes(-5) }));

    await expect(useCase.execute('abc')).rejects.toMatchObject({
      code: 'RECOVERY_LINK_USED',
      reason: 'conflict',
    });
    expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'enlace_reutilizado' }));
  });

  it('un enlace reemplazado por otro más reciente lo indica sin confundirlo con uno usado', async () => {
    const { useCase } = setup(link({ revoked: true }));

    await expect(useCase.execute('abc')).rejects.toMatchObject({
      code: 'RECOVERY_LINK_REPLACED',
      reason: 'conflict',
    });
  });
});