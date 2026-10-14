import { createRedisClient, getRedisOptions } from './redis';

describe('getRedisOptions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('utiliza localhost y el puerto 6379 por defecto', () => {
    expect(getRedisOptions()).toMatchObject({
      host: 'localhost',
      port: 6379,
    });
  });

  it('utiliza las variables de entorno configuradas', () => {
    process.env.REDIS_HOST = 'redis';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'secret';

    expect(getRedisOptions()).toMatchObject({
      host: 'redis',
      port: 6380,
      password: 'secret',
    });
  });

  it('rechaza un puerto inválido', () => {
    process.env.REDIS_PORT = 'incorrecto';

    expect(() => getRedisOptions()).toThrow(
      'REDIS_PORT debe ser un puerto válido',
    );
  });

  it('createRedisClient usa REDIS_URL cuando existe (la forma que entrega Render)', () => {
    process.env.REDIS_URL = 'redis://red-ejemplo:6379';

    const client = createRedisClient();
    expect(client.options.host).toBe('red-ejemplo');
    expect(client.options.port).toBe(6379);
    client.disconnect();
  });

  it('createRedisClient usa host/puerto cuando no hay REDIS_URL', () => {
    process.env.REDIS_HOST = 'redis-interno';
    process.env.REDIS_PORT = '6381';

    const client = createRedisClient();
    expect(client.options.host).toBe('redis-interno');
    expect(client.options.port).toBe(6381);
    client.disconnect();
  });
});