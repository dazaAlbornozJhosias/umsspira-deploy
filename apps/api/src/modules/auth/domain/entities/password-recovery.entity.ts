export interface RecoveryTokenRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  revoked: boolean;
}