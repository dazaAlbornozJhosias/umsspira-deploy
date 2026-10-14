import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

const logger = new Logger('JwtSecret');

// Secreto de respaldo generado una sola vez por proceso.
let secretoDeRespaldo: string | null = null;

/**
 * Resuelve el secreto del mecanismo JWT local (el de la época "empresa", que
 * solo usan los módulos legacy de companies/job-postings).
 *
 * El inicio de sesión real NO firma tokens con esta clave: devuelve el JWT de
 * Supabase y la validación pasa por AuthGuard (Supabase Auth). Por eso
 * JWT_SECRET es opcional: sin ella la API debe poder arrancar (en Render y en
 * local no está definida) y el mecanismo legacy queda en fail-closed: rechaza
 * cualquier token hasta que se configure la variable.
 */
export function resolveJwtSecret(config: ConfigService): string {
  const configurado = config.get<string>('JWT_SECRET');
  if (configurado) return configurado;

  if (!secretoDeRespaldo) {
    secretoDeRespaldo = randomBytes(48).toString('hex');
    logger.warn(
      'JWT_SECRET no está definido: se usará un secreto aleatorio por arranque y los endpoints ' +
        'que dependen del JWT local (companies/job-postings) rechazarán todo token. ' +
        'Define JWT_SECRET en el entorno si esos módulos se usan.',
    );
  }
  return secretoDeRespaldo;
}
