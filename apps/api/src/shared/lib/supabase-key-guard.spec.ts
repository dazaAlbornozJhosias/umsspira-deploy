import { assertServiceRoleKey } from './supabase-key-guard';

/** Payload de un JWT Supabase firmado con el secreto del proyecto (la firma no se valida aquí). */
function jwtConRol(role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `${header}.${payload}.firma-de-prueba`;
}

describe('assertServiceRoleKey', () => {
  it('acepta la clave JWT service_role clásica', () => {
    expect(() =>
      assertServiceRoleKey({
        SUPABASE_URL: 'https://proyecto.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: jwtConRol('service_role'),
      }),
    ).not.toThrow();
  });

  it('rechaza la clave anon', () => {
    expect(() =>
      assertServiceRoleKey({
        SUPABASE_URL: 'https://proyecto.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: jwtConRol('anon'),
      }),
    ).toThrow(/rol "anon".*"service_role"/);
  });

  it('rechaza las claves nuevas sb_secret_ / sb_publishable_', () => {
    expect(() =>
      assertServiceRoleKey({
        SUPABASE_URL: 'https://proyecto.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_abcdefghijklmno',
      }),
    ).toThrow(/no es una clave JWT clásica/);
  });

  it('rechaza un token de sesión cortado o ilegible', () => {
    const payloadIlegible = Buffer.from('esto no es json').toString('base64url');
    expect(() =>
      assertServiceRoleKey({
        SUPABASE_URL: 'https://proyecto.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: `eyJhbGciOiJIUzI1NiJ9.${payloadIlegible}.firma`,
      }),
    ).toThrow(/JWT ilegible/);
  });

  it('rechaza la ausencia de variables', () => {
    expect(() => assertServiceRoleKey({})).toThrow(/Falta SUPABASE_URL/);
    expect(() =>
      assertServiceRoleKey({ SUPABASE_URL: 'https://proyecto.supabase.co' }),
    ).toThrow(/Falta SUPABASE_SERVICE_ROLE_KEY/);
  });
});
