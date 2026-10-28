import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { BackupLinkSigner } from '../ports/backup-link-signer.port';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { BACKUP_LINK_TTL_SECONDS, CreateBackupLinkUseCase } from './create-backup-link.use-case';
import { ReadSignedBackupUseCase } from './read-signed-backup.use-case';

const certificationId = '0b6f1c1e-4f7a-4c55-9a52-1f6f0d3b2a10';
const actor: ActorContext = {
  id: 'usuario-1',
  email: 'titulado@example.com',
  name: 'María Pérez',
  role: 'titulado',
  credentialVersion: 1,
  permissions: ['perfil:self:read'],
  scopes: { graduateId: 'titulado-1', companyIds: [], careerIds: [] },
};
const file = {
  id: 'r-1',
  name: 'aws.jpg',
  mime: 'image/jpeg',
  bytes: new Uint8Array([1]),
  size: 1,
};
const now = Date.UTC(2026, 9, 23, 17, 0, 0);

function setup() {
  const repository = {
    findBackupOwner: jest.fn(),
    readBackupFile: jest.fn().mockResolvedValue(file),
  };
  const signer: BackupLinkSigner = {
    sign: jest.fn((id: string, expiresAt: number) => `${id}.${expiresAt}`),
    verify: jest.fn(
      (id: string, expiresAt: number, signature: string) => signature === `${id}.${expiresAt}`,
    ),
  };
  const asRepository = repository as unknown as ProfileRepository;
  return {
    repository,
    create: new CreateBackupLinkUseCase(asRepository, signer),
    read: new ReadSignedBackupUseCase(asRepository, signer),
  };
}

describe('Enlace firmado del respaldo', () => {
  it('firma un enlace que vence en 5 minutos', async () => {
    const { repository, create } = setup();
    repository.findBackupOwner.mockResolvedValue({
      graduateId: 'titulado-1',
      userId: 'usuario-1',
      hasBackup: true,
    });

    const link = await create.execute(actor, certificationId, now);

    expect(BACKUP_LINK_TTL_SECONDS).toBe(300);
    expect(link.expiresAt).toBe(now / 1000 + 300);
    expect(link.signature).toBe(`${certificationId}.${link.expiresAt}`);
  });

  it('genera un enlace nuevo en cada apertura', async () => {
    const { repository, create } = setup();
    repository.findBackupOwner.mockResolvedValue({
      graduateId: 'titulado-1',
      userId: 'usuario-1',
      hasBackup: true,
    });

    const first = await create.execute(actor, certificationId, now);
    const second = await create.execute(actor, certificationId, now + 1000);

    expect(second.signature).not.toBe(first.signature);
  });

  it.each([
    ['otro titulado', { graduateId: 'titulado-2', userId: 'usuario-2', hasBackup: true }],
    ['otro usuario', { graduateId: 'titulado-1', userId: 'usuario-2', hasBackup: true }],
  ])('responde 403 si la certificación es de %s y no firma el enlace', async (_, owner) => {
    const { repository, create } = setup();
    repository.findBackupOwner.mockResolvedValue(owner);

    await expect(create.execute(actor, certificationId, now)).rejects.toMatchObject({
      reason: 'forbidden',
      message: 'No tienes permiso para ver este respaldo',
    });
  });

  it.each([
    ['no existe', null],
    ['no tiene respaldo', { graduateId: 'titulado-1', userId: 'usuario-1', hasBackup: false }],
  ])('responde 404 si la certificación %s', async (_, owner) => {
    const { repository, create } = setup();
    repository.findBackupOwner.mockResolvedValue(owner);

    await expect(create.execute(actor, certificationId, now)).rejects.toMatchObject({
      reason: 'missing',
      message: 'No se encontró un respaldo de tu certificación',
    });
  });

  it('entrega el archivo con una firma vigente', async () => {
    const { repository, read } = setup();
    const expiresAt = now / 1000 + 300;

    await expect(
      read.execute(certificationId, expiresAt, `${certificationId}.${expiresAt}`, now),
    ).resolves.toBe(file);
    expect(repository.readBackupFile).toHaveBeenCalledWith(certificationId);
  });

  it('rechaza una firma alterada sin leer el archivo', async () => {
    const { repository, read } = setup();

    await expect(
      read.execute(certificationId, now / 1000 + 300, 'alterada', now),
    ).rejects.toMatchObject({
      reason: 'forbidden',
    });
    expect(repository.readBackupFile).not.toHaveBeenCalled();
  });

  it('rechaza un enlace vencido', async () => {
    const { repository, read } = setup();
    const expiresAt = now / 1000 - 1;

    await expect(
      read.execute(certificationId, expiresAt, `${certificationId}.${expiresAt}`, now),
    ).rejects.toMatchObject({
      reason: 'expired',
    });
    expect(repository.readBackupFile).not.toHaveBeenCalled();
  });
});
