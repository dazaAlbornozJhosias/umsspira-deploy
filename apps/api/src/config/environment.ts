import { z } from 'zod';

const postgresUrl = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}, 'Debe ser una URL de PostgreSQL válida');

const corsOrigins = z
  .string()
  .default('http://localhost:3001')
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z.string().refine((origin) => {
          try {
            const url = new URL(origin);
            return (
              ['http:', 'https:'].includes(url.protocol) &&
              url.pathname === '/' &&
              !url.search &&
              !url.hash &&
              !url.username &&
              !url.password
            );
          } catch {
            return false;
          }
        }, 'Debe ser un origen HTTP o HTTPS sin ruta ni credenciales'),
      )
      .min(1),
  )
  .transform((origins) => [...new Set(origins.map((origin) => new URL(origin).origin))]);

export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['epic', 'dev', 'test', 'production']).default('epic'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGINS: corsOrigins,
    SMTP_URL: z
      .url()
      .refine(
        (value) => ['smtp:', 'smtps:'].includes(new URL(value).protocol),
        'Debe ser una URL SMTP',
      )
      .default('smtp://127.0.0.1:1025'),
    MAIL_FROM: z
      .string()
      .min(1)
      .refine((value) => !/[\r\n]/.test(value), 'Remitente inválido')
      .default('UMSSPIRA <no-reply@umsspira.local>'),
    BREVO_API_KEY: z.string().min(1).optional(),
    AUTH_RATE_LIMIT_STORE: z.enum(['memory', 'redis']).optional(),
    REDIS_URL: z
      .url()
      .refine(
        (value) => ['redis:', 'rediss:'].includes(new URL(value).protocol),
        'Debe ser una URL de Redis válida',
      )
      .optional(),
    DATABASE_URL: postgresUrl,
    DIRECT_URL: postgresUrl.optional(),
    SHADOW_DATABASE_URL: postgresUrl.optional(),
    AUTH_JWT_SECRET: z.string().min(64, 'La clave de firma debe tener al menos 64 caracteres'),
    AUTH_JWT_ISSUER: z.string().min(1).default('umsspira-api'),
    AUTH_JWT_AUDIENCE: z.string().min(1).default('umsspira-web'),
    AUTH_ACCESS_SECONDS: z.coerce.number().int().min(60).max(1800).default(900),
    AUTH_SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(12),
    AUTH_REMEMBER_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    AUTH_COOKIE_SECURE: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    CORRECTION_LINK_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    WEB_BASE_URL: z.string().url().default('http://localhost:3001'),
  })
  .superRefine((env, context) => {
    const store = env.AUTH_RATE_LIMIT_STORE ?? (env.NODE_ENV === 'production' ? 'redis' : 'memory');
    if (store === 'redis' && !env.REDIS_URL) {
      context.addIssue({
        code: 'custom',
        path: ['REDIS_URL'],
        message: 'El limitador Redis requiere una conexión explícita',
      });
    }
    if (env.NODE_ENV === 'production' && env.AUTH_COOKIE_SECURE === false) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SECURE'],
        message: 'Las cookies requieren HTTPS en producción',
      });
    }
  })
  .transform((env) => ({
    ...env,
    AUTH_RATE_LIMIT_STORE:
      env.AUTH_RATE_LIMIT_STORE ?? (env.NODE_ENV === 'production' ? 'redis' : 'memory'),
    REDIS_URL: env.REDIS_URL ?? 'redis://localhost:6379',
  }));

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(values: Record<string, unknown>): Environment {
  const result = environmentSchema.safeParse(values);
  if (!result.success) {
    // No incluir valores del entorno: pueden contener contraseñas y claves.
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Configuración de entorno inválida: ${issues.join('; ')}`);
  }
  return result.data;
}
