import { Logger } from '@nestjs/common';

const logger = new Logger('SupabaseKeyGuard');

/**
 * Valida que SUPABASE_SERVICE_ROLE_KEY sea la clave JWT `service_role` clásica
 * del proyecto (la de Supabase Dashboard → Settings → API).
 *
 * Se ejecuta AL ARRANCAR la aplicación. Si la clave es la equivocada (la anon,
 * una `sb_publishable_`/`sb_secret_`, o un token de sesión copiado del
 * navegador), Supabase no da error: devuelve las tablas VACÍAS por RLS y la
 * app "funciona" mostrando "no hay datos". Este guard lo corta de raíz: la API
 * no arranca y el error queda claro en los logs de Render.
 */
export function assertServiceRoleKey(env: NodeJS.ProcessEnv = process.env): void {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Falta SUPABASE_URL en el entorno de la API');
  }
  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno de la API');
  }

  const partes = key.split('.');
  if (partes.length !== 3) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY no es una clave JWT clásica (empieza con "${key.slice(0, 12)}..."). ` +
        'Usa la clave "service_role" del dashboard de Supabase (Settings → API → Project API keys → ' +
        'service_role, la que empieza con eyJhbGciOiJI). NO sirven sb_secret_*, sb_publishable_* ni ' +
        'tokens de sesión copiados del navegador.',
    );
  }

  let payload: { role?: unknown };
  try {
    payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY es un JWT ilegible: cópiala completa, sin cortar ni espacios extra',
    );
  }

  if (payload.role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY tiene el rol "${String(payload.role ?? 'sin rol')}" en lugar de ` +
        '"service_role". Con esa clave la API vería las tablas vacías por RLS. ' +
        'Reemplázala por la clave "service_role" del dashboard de Supabase (Settings → API).',
    );
  }

  logger.log('SUPABASE_SERVICE_ROLE_KEY verificada: es la clave service_role del proyecto');
}
