export const CORRECTION_TOKEN_PORT = Symbol('CORRECTION_TOKEN_PORT');

export interface StoredCorrectionToken {
  id: string;
  applicationId: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  revoked: boolean;
}

export interface CorrectionTokenPort {
  saveToken(applicationId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findActiveToken(tokenHash: string): Promise<StoredCorrectionToken | null>;
  revokeByApplication(applicationId: string): Promise<void>;
  getApplicationStatus(applicationId: string): Promise<string | null>;
}
