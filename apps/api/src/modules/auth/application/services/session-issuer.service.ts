import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { AuthSession } from '../../domain/entities/auth-session.entity';
import type { AuthOptions } from '../contracts/auth-options';
import type { IssuedSession } from '../contracts/issued-session';
import type { TokenService } from '../ports/token-service.port';

export class SessionIssuer {
  constructor(
    private readonly tokens: TokenService,
    private readonly options: AuthOptions,
  ) {}

  issue(actor: ActorContext, session: AuthSession, csrfToken: string): IssuedSession {
    return {
      actor,
      session,
      csrfToken,
      expiresIn: this.options.accessSeconds,
      accessToken: this.tokens.issueAccess({
        userId: actor.id,
        sessionId: session.id,
        credentialVersion: actor.credentialVersion,
      }),
      refreshToken: `${session.id}.${this.tokens.secret()}`,
    };
  }
}
