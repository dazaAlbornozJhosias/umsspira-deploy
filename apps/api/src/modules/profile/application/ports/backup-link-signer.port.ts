export const BACKUP_LINK_SIGNER = Symbol('BACKUP_LINK_SIGNER');

export interface BackupLinkSigner {
  sign(certificationId: string, expiresAt: number): string;
  verify(certificationId: string, expiresAt: number, signature: string): boolean;
}
