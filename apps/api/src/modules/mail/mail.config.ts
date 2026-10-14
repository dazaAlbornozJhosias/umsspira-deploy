import { setDefaultResultOrder } from 'node:dns';

// Render no tiene ruta IPv6: sin esto, Node prefiere el registro IPv6 de
// smtp.gmail.com y la conexión falla con ENETUNREACH. Se fuerza IPv4 primero.
setDefaultResultOrder('ipv4first');

// Tokens de inyeccion para NestJS: permiten inyectar configuraciones u objetos que no son clases.
export const MAIL_CONFIG = Symbol('MAIL_CONFIG');
export const MAIL_TRANSPORTER = Symbol('MAIL_TRANSPORTER');

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  fromName: string;
  fromAddress: string;
  /**
   * Si existe, los correos se envían por la API HTTPS de Brevo en lugar de
   * SMTP: hay plataformas (Render plan free) que bloquean el correo saliente
   * por SMTP pero no las llamadas HTTPS al puerto 443.
   */
  brevoApiKey?: string;
};

const REQUIRED_VARIABLES = [
  'SMTP_HOST',
  'SMTP_PORT',
  'MAIL_FROM_NAME',
  'MAIL_FROM_ADDRESS',
] as const;

/**
 * Lee las variables de entorno del correo y valida su consistencia.
 * Se ejecuta al arrancar la aplicacion: si algo falta, lanza un error claro y detiene el arranque.
 */
export function readMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const missing = REQUIRED_VARIABLES.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno para el correo: ${missing.join(', ')}`,
    );
  }

  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SMTP_PORT debe ser un numero entero positivo');
  }

  const user = env.SMTP_USER;
  const pass = env.SMTP_PASSWORD;
  // La autenticacion es opcional, pero usuario y contrasena van siempre emparejados.
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('SMTP_USER y SMTP_PASSWORD deben definirse juntos');
  }

  return {
    host: env.SMTP_HOST!,
    port,
    secure: env.SMTP_SECURE === 'true',
    auth: user && pass ? { user, pass } : undefined,
    fromName: env.MAIL_FROM_NAME!,
    fromAddress: env.MAIL_FROM_ADDRESS!,
    brevoApiKey: env.BREVO_API_KEY || undefined,
  };
}