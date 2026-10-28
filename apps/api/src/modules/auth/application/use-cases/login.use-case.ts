import { AccessError } from '../../../../shared/security/errors/access-error';
import type { UserReader } from '../../../user/application/ports/user-reader.port';
import type { AuthSession } from '../../domain/entities/auth-session.entity';
import type { AuthOptions } from '../contracts/auth-options';
import type { IssuedSession } from '../contracts/issued-session';
import type { CredentialRepository } from '../ports/credential-repository.port';
import type { SessionRepository } from '../ports/session-repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { TokenService } from '../ports/token-service.port';
import { SessionIssuer } from '../services/session-issuer.service';
import { AccessLimiter } from '../services/access-limiter.service';

export class LoginUseCase {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly sessions: SessionRepository,
    private readonly users: UserReader,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly options: AuthOptions,
    private readonly issuer: SessionIssuer,
    private readonly limiter: AccessLimiter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: { email: string; password: string; remember: boolean },
    client: { ip: string; agent: string | null },
  ): Promise<IssuedSession> {
    const now = this.now();
    await this.limiter.check(`login:email:${input.email}`, 900_000, 10);
    await this.limiter.check(`login:ip:${client.ip}`, 900_000, 100);
    const credential = await this.credentials.findByEmail(input.email);
    const valid = await this.passwords.verify(input.password, credential?.passwordHash ?? null);
    if (!credential || !valid) {
      throw new AccessError('INVALID_CREDENTIALS');
    }
    const actor = await this.users.findActor(credential.userId);
    if (!actor || actor.credentialVersion !== credential.version) {
      throw new AccessError('INVALID_CREDENTIALS');
    }
    if (this.passwords.needsRehash(credential.passwordHash)) {
      await this.credentials.rehash(credential, await this.passwords.hash(input.password));
    }
    const csrfToken = this.tokens.secret();
    const session: AuthSession = {
      id: this.tokens.id(),
      userId: actor.id,
      credentialVersion: actor.credentialVersion,
      csrfHash: this.tokens.fingerprint(csrfToken),
      createdAt: now,
      renewedAt: now,
      expiresAt: new Date(
        now.getTime() +
          (input.remember ? this.options.rememberDays * 86400 : this.options.sessionHours * 3600) *
            1000,
      ),
      revokedAt: null,
      remember: input.remember,
      agent: client.agent?.slice(0, 256) ?? null,
    };
    const result = this.issuer.issue(actor, session, csrfToken);
    if (!(await this.sessions.create(session, this.tokens.fingerprint(result.refreshToken)))) {
      throw new AccessError('INVALID_CREDENTIALS');
    }
    return result;
  }
}
