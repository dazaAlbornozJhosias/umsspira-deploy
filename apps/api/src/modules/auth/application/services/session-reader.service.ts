import { AccessError } from '../../../../shared/security/errors/access-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UserReader } from '../../../user/application/ports/user-reader.port';
import type { AuthSession } from '../../domain/entities/auth-session.entity';
import { isSessionActive } from '../../domain/policies/session.policy';
import type { RefreshProof, SessionRepository } from '../ports/session-repository.port';
import type { TokenService } from '../ports/token-service.port';

export class SessionReader {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserReader,
    private readonly tokens: TokenService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async proof(token: string, requireUnused: boolean): Promise<RefreshProof> {
    const sessionId = this.tokens.readRefreshSessionId(token);
    const proof = await this.sessions.findRefresh(sessionId, this.tokens.fingerprint(token));
    if (
      !proof ||
      (requireUnused && proof.consumed) ||
      !isSessionActive(proof.session, this.now())
    ) {
      throw new AccessError('UNAUTHENTICATED');
    }
    return proof;
  }

  async actorFor(session: AuthSession): Promise<ActorContext> {
    const actor = await this.users.findActor(session.userId);
    if (!actor || actor.credentialVersion !== session.credentialVersion) {
      throw new AccessError('UNAUTHENTICATED');
    }
    return actor;
  }
}
