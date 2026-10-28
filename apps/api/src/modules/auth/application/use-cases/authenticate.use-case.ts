import { AccessError } from '../../../../shared/security/errors/access-error';
import type { AuthenticatedContext } from '../../../../shared/security/contexts/actor-context';
import { isSessionActive } from '../../domain/policies/session.policy';
import type { SessionRepository } from '../ports/session-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { SessionReader } from '../services/session-reader.service';

export class AuthenticateUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly reader: SessionReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(accessToken: string, csrfToken?: string): Promise<AuthenticatedContext> {
    const claims = this.tokens.verifyAccess(accessToken);
    const session = await this.sessions.find(claims.sessionId);
    if (
      !session ||
      session.userId !== claims.userId ||
      session.credentialVersion !== claims.credentialVersion ||
      !isSessionActive(session, this.now())
    ) {
      throw new AccessError('UNAUTHENTICATED');
    }
    if (csrfToken !== undefined && !this.tokens.matches(csrfToken, session.csrfHash)) {
      throw new AccessError('FORBIDDEN');
    }
    return { actor: await this.reader.actorFor(session), sessionId: session.id };
  }
}
