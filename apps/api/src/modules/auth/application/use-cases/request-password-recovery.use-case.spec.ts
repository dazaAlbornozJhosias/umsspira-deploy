import type { UserReader } from '../../../user/application/ports/user-reader.port';
import type { CredentialRepository } from '../ports/credential-repository.port';
import type { PasswordRecoveryRepository } from '../ports/password-recovery-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { RequestPasswordRecoveryUseCase } from './request-password-recovery.use-case';

const NOW = new Date('2026-10-26T15:00:00Z');
const credential = { userId: 'user-1', email: 'admin@umss.edu.bo', passwordHash: 'h', version: 1 };

function setup(counts = { byEmail: 0, byOrigin: 0 }) {
  const credentials = { findByEmail: jest.fn().mockResolvedValue(credential) };
  const users = { findActor: jest.fn().mockResolvedValue({ id: 'user-1' }) };
  const repository = {
    countRecentRequests: jest.fn().mockResolvedValue(counts),
    recordRequest: jest.fn().mockResolvedValue(undefined),
    issue: jest.fn().mockResolvedValue(true),
  };
  const tokens = {
    secret: jest.fn().mockReturnValue('secret-token'),
    fingerprint: jest.fn((value: string) => `hash(${value})`),
  };
  const useCase = new RequestPasswordRecoveryUseCase(
    credentials as unknown as CredentialRepository,
    users as unknown as UserReader,
    repository as unknown as PasswordRecoveryRepository,
    tokens as unknown as TokenService,
    { webBaseUrl: 'http://localhost:3001' },
    () => NOW,
  );
  return { credentials, users, repository, tokens, useCase };
}

const input = { email: 'admin@umss.edu.bo', origin: '1.2.3.4' };

describe('RequestPasswordRecoveryUseCase', () => {
  it('crea el enlace de 60 minutos para una cuenta activa y guarda solo su hash (CA-12.1, CA-12.3)', async () => {
    const { repository, useCase } = setup();

    await useCase.execute(input);

    expect(repository.issue).toHaveBeenCalledTimes(1);
    const issued = repository.issue.mock.calls[0][0];
    expect(issued).toMatchObject({
      userId: 'user-1',
      email: 'admin@umss.edu.bo',
      tokenHash: 'hash(secret-token)',
      expiresAt: new Date('2026-10-26T16:00:00Z'),
      now: NOW,
    });
    expect(issued.body).toContain('http://localhost:3001/reset-password?token=secret-token');
    expect(issued.body).toContain('60 minutos');
    expect(Object.values(issued)).not.toContain('secret-token');
    expect(repository.recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'solicitado', userId: 'user-1' }),
    );
  });

  it('no envía nada si el correo no existe, y lo registra (CA-12.2)', async () => {
    const { credentials, repository, useCase } = setup();
    credentials.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(input)).resolves.toBeUndefined();

    expect(repository.issue).not.toHaveBeenCalled();
    expect(repository.recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'rechazado_no_existe', userId: null }),
    );
  });

  it('no envía nada si la cuenta no está activa (CA-12.5)', async () => {
    const { users, repository, useCase } = setup();
    users.findActor.mockResolvedValue(null);

    await expect(useCase.execute(input)).resolves.toBeUndefined();

    expect(repository.issue).not.toHaveBeenCalled();
    expect(repository.recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'rechazado_inactivo', userId: 'user-1' }),
    );
  });

  it.each([
    ['correo', { byEmail: 3, byOrigin: 0 }],
    ['origen', { byEmail: 0, byOrigin: 3 }],
  ])('rechaza la cuarta solicitud por hora por %s sin consultar la cuenta (CA-12.2)', async (_label, counts) => {
    const { credentials, repository, useCase } = setup(counts);

    await expect(useCase.execute(input)).resolves.toBeUndefined();

    expect(credentials.findByEmail).not.toHaveBeenCalled();
    expect(repository.issue).not.toHaveBeenCalled();
    expect(repository.recordRequest).toHaveBeenCalledWith(expect.objectContaining({ result: 'rechazado_rate' }));
  });

  it('con 2 solicitudes previas todavía permite la tercera', async () => {
    const { repository, useCase } = setup({ byEmail: 2, byOrigin: 2 });

    await useCase.execute(input);

    expect(repository.issue).toHaveBeenCalledTimes(1);
  });

  it('cuenta las solicitudes de la última hora y guarda el origen solo con hash', async () => {
    const { repository, useCase } = setup();

    await useCase.execute(input);

    expect(repository.countRecentRequests).toHaveBeenCalledWith(
      'admin@umss.edu.bo',
      'hash(recovery-origin:1.2.3.4)',
      new Date('2026-10-26T14:00:00Z'),
    );
    const recorded = repository.recordRequest.mock.calls[0][0];
    expect(recorded.originHash).toBe('hash(recovery-origin:1.2.3.4)');
    expect(recorded).not.toHaveProperty('origin');
  });

  it('no falla si otra solicitud simultánea ya creó el enlace', async () => {
    const { repository, useCase } = setup();
    repository.issue.mockResolvedValue(false);

    await expect(useCase.execute(input)).resolves.toBeUndefined();
  });

  it('todos los casos terminan igual para quien llama (CA-12.2)', async () => {
    const outcomes: unknown[] = [];
    for (const arrange of [
      () => undefined,
      (s: ReturnType<typeof setup>) => s.credentials.findByEmail.mockResolvedValue(null),
      (s: ReturnType<typeof setup>) => s.users.findActor.mockResolvedValue(null),
    ]) {
      const current = setup();
      arrange(current);
      outcomes.push(await current.useCase.execute(input));
    }
    expect(new Set(outcomes).size).toBe(1);
  });
});
