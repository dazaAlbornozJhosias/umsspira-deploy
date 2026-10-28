import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { StoredFile } from '../../../../shared/files/contracts/uploaded-file';
import type { BackupLinkSigner } from '../ports/backup-link-signer.port';
import type { ProfileRepository } from '../ports/profile-repository.port';

export class ReadSignedBackupUseCase {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly signer: BackupLinkSigner,
  ) {}

  async execute(
    id: string,
    expiresAt: number,
    signature: string,
    now = Date.now(),
  ): Promise<StoredFile> {
    if (!this.signer.verify(id, expiresAt, signature)) {
      throw new BusinessRuleError(
        'forbidden',
        'BACKUP_LINK_INVALID',
        'El enlace del respaldo no es válido',
      );
    }
    if (expiresAt * 1000 <= now) {
      throw new BusinessRuleError(
        'expired',
        'BACKUP_LINK_EXPIRED',
        'El enlace del respaldo venció',
      );
    }
    return this.repository.readBackupFile(id);
  }
}
