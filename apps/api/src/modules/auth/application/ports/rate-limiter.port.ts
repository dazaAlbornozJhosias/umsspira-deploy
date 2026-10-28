export const RATE_LIMITER = Symbol('RATE_LIMITER');
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}
export interface RateLimiter {
  consume(key: string, windowMs: number, limit: number): Promise<RateLimitResult>;
}
