import { AccessError } from '../../../../shared/security/errors/access-error';
import type { RateLimiter } from '../ports/rate-limiter.port';
import type { TokenService } from '../ports/token-service.port';

export class AccessLimiter {
  constructor(
    private readonly limiter: RateLimiter,
    private readonly tokens: TokenService,
  ) {}

  async check(key: string, windowMs: number, limit: number): Promise<void> {
    const result = await this.limiter.consume(this.tokens.fingerprint(key), windowMs, limit);
    if (!result.allowed) {
      throw new AccessError('RATE_LIMITED', result.retryAfterSeconds);
    }
  }
}
