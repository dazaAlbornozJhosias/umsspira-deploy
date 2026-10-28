import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../shared/infrastructure/redis/redis.service';
import { DependencyUnavailableError } from '../../../../shared/errors/dependency-unavailable-error';
import type { RateLimiter, RateLimitResult } from '../../application/ports/rate-limiter.port';
import { CONSUME_RATE_LIMIT_SCRIPT } from '../scripts/consume-rate-limit.script';

@Injectable()
export class RedisRateLimiter implements RateLimiter {
  constructor(private readonly redis: RedisService) {}

  async consume(key: string, windowMs: number, limit: number): Promise<RateLimitResult> {
    const result = await this.redis.evaluate(CONSUME_RATE_LIMIT_SCRIPT, `auth:limit:${key}`, [
      windowMs,
    ]);
    if (!Array.isArray(result) || result.length !== 2 || !result.every(Number.isFinite)) {
      throw new DependencyUnavailableError();
    }
    return {
      allowed: result[0] <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil(result[1] / 1000)),
    };
  }
}
