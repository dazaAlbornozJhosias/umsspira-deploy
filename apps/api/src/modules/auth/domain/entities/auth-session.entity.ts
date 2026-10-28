export interface AuthSession {
  id: string;
  userId: string;
  credentialVersion: number;
  csrfHash: string;
  createdAt: Date;
  renewedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  remember: boolean;
  agent: string | null;
}
