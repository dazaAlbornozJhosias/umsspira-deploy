import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { BackupLinkSigner } from '../ports/backup-link-signer.port';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export const BACKUP_LINK_TTL_SECONDS = 300;

export interface BackupLink {
  certificationId: string;
  expiresAt: number;
  signature: string;
}

export class CreateBackupLinkUseCase {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly signer: BackupLinkSigner,
  ) {}

  async execute(actor: ActorContext, id: string, now = Date.now()): Promise<BackupLink> {
    const scope = profileScope(actor);
    const owner = await this.repository.findBackupOwner(id);
    if (owner && (owner.graduateId !== scope.graduateId || owner.userId !== scope.userId)) {
      throw new BusinessRuleError(
        'forbidden',
        'BACKUP_FORBIDDEN',
        'No tienes permiso para ver este respaldo',
      );
    }
    if (!owner?.hasBackup) {
      throw new BusinessRuleError(
        'missing',
        'BACKUP_NOT_FOUND',
        'No se encontró un respaldo de tu certificación',
      );
    }
    const expiresAt = Math.floor(now / 1000) + BACKUP_LINK_TTL_SECONDS;
    return { certificationId: id, expiresAt, signature: this.signer.sign(id, expiresAt) };
  }
}
