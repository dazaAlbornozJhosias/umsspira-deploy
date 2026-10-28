import { validateEnvironment } from './environment';

const database = {
  DATABASE_URL: 'postgresql://usuario:clave@localhost:5432/umsspira',
  AUTH_JWT_SECRET: 'clave-exclusiva-de-pruebas-'.repeat(4),
};

describe('Configuración del entorno', () => {
  it('utiliza memoria por defecto en desarrollo', () => {
    expect(validateEnvironment(database).AUTH_RATE_LIMIT_STORE).toBe('memory');
  });

  it('permite elegir Redis explícitamente para probarlo en desarrollo', () => {
    const env = validateEnvironment({
      ...database,
      AUTH_RATE_LIMIT_STORE: 'redis',
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(env.AUTH_RATE_LIMIT_STORE).toBe('redis');
  });

  it('en producción usa Redis por defecto y exige una conexión explícita', () => {
    expect(() => validateEnvironment({ ...database, NODE_ENV: 'production' })).toThrow('REDIS_URL');
    expect(
      validateEnvironment({
        ...database,
        NODE_ENV: 'production',
        REDIS_URL: 'rediss://redis.example.edu.bo:6379',
      }).AUTH_RATE_LIMIT_STORE,
    ).toBe('redis');
  });

  it('permite elegir memoria explícitamente para un despliegue de una instancia', () => {
    expect(
      validateEnvironment({
        ...database,
        NODE_ENV: 'production',
        AUTH_RATE_LIMIT_STORE: 'memory',
      }).AUTH_RATE_LIMIT_STORE,
    ).toBe('memory');
  });

  it('convierte el puerto y normaliza los orígenes permitidos', () => {
    const env = validateEnvironment({
      ...database,
      PORT: '3005',
      CORS_ORIGINS: 'http://localhost:3001/, https://ejemplo.edu.bo, http://localhost:3001',
    });
    expect(env.PORT).toBe(3005);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3001', 'https://ejemplo.edu.bo']);
  });

  it.each([
    '*',
    'https://ejemplo.edu.bo/ruta',
    'file:///tmp',
    'https://usuario:clave@ejemplo.edu.bo',
  ])('rechaza un origen inválido: %s', (origin) =>
    expect(() => validateEnvironment({ ...database, CORS_ORIGINS: origin })).toThrow(),
  );

  it('rechaza un entorno sin conexión PostgreSQL', () => {
    expect(() => validateEnvironment({})).toThrow('DATABASE_URL');
  });

  it('asigna valores por defecto al enlace de correccion', () => {
    const env = validateEnvironment(database);
    expect(env.CORRECTION_LINK_TTL_DAYS).toBe(7);
    expect(env.WEB_BASE_URL).toBe('http://localhost:3001');
  });

  it('rechaza puertos inválidos', () => {
    expect(() => validateEnvironment({ ...database, PORT: '0' })).toThrow('PORT');
  });
});
