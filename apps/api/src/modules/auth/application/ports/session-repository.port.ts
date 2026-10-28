import type { AuthSession } from '../../domain/entities/auth-session.entity';
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export type RotationResult = 'rotated' | 'invalid' | 'reused';
export interface RefreshProof {
  session: AuthSession;
  consumed: boolean;
}
export interface SessionRepository {
  create(session: AuthSession, refreshHash: string): Promise<boolean>;
  find(id: string): Promise<AuthSession | null>;
  findRefresh(sessionId: string, hash: string): Promise<RefreshProof | null>;
  rotate(sessionId: string, oldHash: string, newHash: string, now: Date): Promise<RotationResult>;
  revoke(id: string, userId: string, now: Date, reason: string): Promise<boolean>;
  revokeAll(userId: string, now: Date): Promise<void>;
  list(userId: string, now: Date): Promise<AuthSession[]>;
}
