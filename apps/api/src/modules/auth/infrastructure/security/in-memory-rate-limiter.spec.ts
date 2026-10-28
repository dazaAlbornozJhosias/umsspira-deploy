import { InMemoryRateLimiter } from './in-memory-rate-limiter';

describe('Límites locales en memoria', () => {
  let now: number;
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    now = 0;
    limiter = new InMemoryRateLimiter(() => now);
  });

  it('limita los intentos y comunica el tiempo restante sin extender la ventana', async () => {
    await expect(limiter.consume('correo', 15_000, 2)).resolves.toMatchObject({ allowed: true });
    now = 5_000;
    await expect(limiter.consume('correo', 15_000, 2)).resolves.toMatchObject({ allowed: true });
    now = 6_000;
    await expect(limiter.consume('correo', 15_000, 2)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 9,
    });
    now = 15_000;
    await expect(limiter.consume('correo', 15_000, 2)).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 15,
    });
  });

  it('mantiene límites independientes por clave', async () => {
    await limiter.consume('uno', 60_000, 1);
    await expect(limiter.consume('uno', 60_000, 1)).resolves.toMatchObject({ allowed: false });
    await expect(limiter.consume('otro', 60_000, 1)).resolves.toMatchObject({ allowed: true });
  });

  it('cada instancia conserva sus propios contadores', async () => {
    await limiter.consume('correo', 60_000, 1);
    const another = new InMemoryRateLimiter(() => now);
    await expect(another.consume('correo', 60_000, 1)).resolves.toMatchObject({ allowed: true });
  });
});
