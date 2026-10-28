import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { AuthSession } from '../../domain/entities/auth-session.entity';

export interface IssuedSession {
  actor: ActorContext;
  session: AuthSession;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  expiresIn: number;
}
