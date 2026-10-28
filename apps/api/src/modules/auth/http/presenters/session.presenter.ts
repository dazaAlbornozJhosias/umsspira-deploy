import type { AuthSession } from '../../domain/entities/auth-session.entity';

export function presentSession(session: AuthSession, currentId: string) {
  return {
    id: session.id,
    current: session.id === currentId,
    createdAt: session.createdAt.toISOString(),
    renewedAt: session.renewedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    agent: session.agent,
  };
}
