import type { AuthSession } from '../entities/auth-session.entity';
export function isSessionActive(session: AuthSession, now: Date): boolean {
  return session.revokedAt === null && session.expiresAt.getTime() > now.getTime();
}
