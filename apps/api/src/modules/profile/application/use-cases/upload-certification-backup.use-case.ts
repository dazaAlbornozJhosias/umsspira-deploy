import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UploadedFileData } from '../../../../shared/files/contracts/uploaded-file';
import { safeFileName, validateImage } from '../../../../shared/files/policies/image-file.policy';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export class UploadCertificationBackupUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, id: string, file?: UploadedFileData) {
    const scope = profileScope(actor);
    if (!file) {
      throw new BusinessRuleError(
        'invalid',
        'BACKUP_REQUIRED',
        'Adjunta el respaldo JPG de la certificación',
      );
    }
    const mime = validateImage(file.originalname, file.buffer, true);
    return this.repository.saveBackup(scope, id, {
      id: randomUUID(),
      name: safeFileName(file.originalname),
      mime,
      bytes: file.buffer,
      size: file.buffer.length,
    });
  }
}
