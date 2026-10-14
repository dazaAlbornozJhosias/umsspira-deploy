// apps/api/src/shared/guards/user-roles.ts
import type { UserRole } from '@umsspira/shared-types';

export const USER_ROLES: readonly UserRole[] = ['administrador', 'titulado', 'empresa'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/** Forma mínima del usuario de Supabase que llega al resolver el rol. */
export type UserWithMetadata = {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

/**
 * Resuelve el rol del usuario con las fuentes que existen en la práctica:
 * - `app_metadata.role`: lo fija el equipo con la clave de servicio.
 * - `user_metadata.rol` / `user_metadata.role`: lo fija quien crea el usuario
 *   desde el dashboard de Supabase (solo puede escribir user_metadata).
 * Devuelve null si ninguna fuente trae un rol permitido.
 */
export function resolveUserRole(user: UserWithMetadata | null | undefined): UserRole | null {
  const fuentes: unknown[] = [
    user?.app_metadata?.role,
    user?.app_metadata?.rol,
    user?.user_metadata?.rol,
    user?.user_metadata?.role,
  ];
  for (const fuente of fuentes) {
    if (isUserRole(fuente)) return fuente;
  }
  return null;
}