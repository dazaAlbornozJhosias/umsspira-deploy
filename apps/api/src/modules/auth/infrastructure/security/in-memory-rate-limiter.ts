import type { RateLimiter, RateLimitResult } from '../../application/ports/rate-limiter.port';

interface AttemptCounter {
  attempts: number;
  expiresAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, AttemptCounter>();
  private nextCleanup = 0;

  constructor(private readonly now: () => number = Date.now) {}

  async consume(key: string, windowMs: number, limit: number): Promise<RateLimitResult> {
    const now = this.now();
    if (now >= this.nextCleanup) {
      for (const [id, counter] of this.counters) {
        if (counter.expiresAt <= now) {
          this.counters.delete(id);
        }
      }
      this.nextCleanup = now + 60_000;
    }

    const previous = this.counters.get(key);
    const counter =
      previous && previous.expiresAt > now ? previous : { attempts: 0, expiresAt: now + windowMs };
    counter.attempts = Math.min(counter.attempts + 1, limit + 1);
    this.counters.set(key, counter);

    return {
      allowed: counter.attempts <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((counter.expiresAt - now) / 1000)),
    };
  }
}
