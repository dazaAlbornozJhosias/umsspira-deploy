import { AccessError } from '../../../../shared/security/errors/access-error';
import type { IssuedSession } from '../contracts/issued-session';
import type { SessionRepository } from '../ports/session-repository.port';
import type { TokenService } from '../ports/token-service.port';
import { SessionIssuer } from '../services/session-issuer.service';
import { SessionReader } from '../services/session-reader.service';
import { AccessLimiter } from '../services/access-limiter.service';

export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenService,
    private readonly issuer: SessionIssuer,
    private readonly reader: SessionReader,
    private readonly limiter: AccessLimiter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(refreshToken: string, csrfToken: string, ip: string): Promise<IssuedSession> {
    const now = this.now();
    await this.limiter.check(`refresh:ip:${ip}`, 60_000, 120);
    const proof = await this.reader.proof(refreshToken, false);
    if (!this.tokens.matches(csrfToken, proof.session.csrfHash)) {
      throw new AccessError('FORBIDDEN');
    }
    const actor = await this.reader.actorFor(proof.session);
    const result = this.issuer.issue(actor, proof.session, csrfToken);
    const rotation = await this.sessions.rotate(
      proof.session.id,
      this.tokens.fingerprint(refreshToken),
      this.tokens.fingerprint(result.refreshToken),
      now,
    );
    if (rotation === 'reused') {
      throw new AccessError('SESSION_REUSED');
    }
    if (rotation !== 'rotated') {
      throw new AccessError('UNAUTHENTICATED');
    }
    return result;
  }
}
