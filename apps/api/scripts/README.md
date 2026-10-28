# Población y mantenimiento

Los scripts usan Prisma y la conexión configurada en `apps/api/.env`; Supabase aloja únicamente PostgreSQL. No se ejecutan al arrancar Nest.

## Preparación de una base nueva

`APP_ENV` es una variable del entorno, no una rama de Git. Los valores `epic`, `dev` y `test` describen el destino de los datos de demostración; cualquier nombre de rama del equipo puede utilizarse. El seed no consulta Git ni deduce credenciales a partir de la rama.

1. Configurar `DATABASE_URL` y `DIRECT_URL` propios del equipo.
2. Aplicar el esquema con `pnpm --filter api db:deploy`.
3. Generar el cliente con `pnpm --filter api prisma:generate`.
4. Para datos falsos, definir `APP_ENV=epic`, `dev` o `test` y ejecutar `pnpm --filter api db:seed:demo`. Este único comando incluye el catálogo y todas las épicas.

Cada equipo añade sus datos en `seed/epic-N.ts`. Los catálogos compartidos se declaran en `seed/catalogs.ts` y las cuentas en `seed/demo-accounts.ts`. En [seed/README.md](seed/README.md) están la cobertura, el ejemplo y el orden de las relaciones. Si solo se necesitan catálogos sin datos de demostración, ejecutar `pnpm --filter api db:seed`.

El seed de catálogo crea roles, permisos y asignaciones que falten. Mantiene el estado habilitado/deshabilitado, pero vuelve a añadir las asignaciones iniciales ausentes; es preparación explícita, no sincronización automática de políticas.

El seed de demostración incluye el catálogo y crea estas cuentas:

| Correo               | Contraseña de demostración | Rol           |
| -------------------- | -------------------------- | ------------- |
| titulado@umss.edu.bo | titulado1234               | titulado      |
| admin@umss.edu.bo    | admin1234                  | administrador |
| empresa@umss.edu.bo  | empresa1234                | empresa       |

Las cuentas se guardan con Argon2id y estado ACTIVO, con perfiles de titulado, empresa y administrador de carrera para que `me.scopes` muestre identificadores utilizables. La demostración incluye datos relacionados de registro documental, perfil profesional, NLP, empresas, vacantes, mentorías, eventos y reportes. Los equipos pueden ampliar esos arreglos sin cambiar el comando de carga.

Los UUID del juego de demostración son constantes válidas para reproducir las mismas referencias en cada base. En las operaciones normales, los nuevos identificadores se generan con `randomUUID()` o con los defaults UUID de PostgreSQL.

Repetir la demostración conserva datos, contraseñas y estado de cuentas existentes. Si un correo de demostración pertenece a otro UUID, se rechaza la operación; no se sobrescribe esa cuenta. Un rol deshabilitado tampoco se reactiva. Las relaciones de demostración se crean al insertar cada cuenta, no se reconstruyen automáticamente después de cambios manuales.

El comando exige `APP_ENV` explícito y rechaza `production` o su ausencia antes de consultar la base. Las claves breves solicitadas son exclusivas de esta población; no cambian la política de contraseñas del API. El seed normal no crea cuentas de demostración y la base de producción no recibe estos datos falsos.

## Roles y permisos

`ROLE_PERMISSIONS` expresa el catálogo inicial en el módulo user; la base conserva sus políticas vigentes. Titulado, empresa y administrador son los tres roles actuales. Mentor es una participación del titulado, no un rol de login adicional.

| Rol           | Permisos iniciales                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| administrador | `user:self:read`, `auth:sessions:self`, `solicitudes:read`, `solicitudes:review`, `eventos:manage`, `reportes:read`, `mentores:manage` |
| titulado      | `user:self:read`, `auth:sessions:self`, `perfil:self:read`, `perfil:self:write`, `mentores:self:write`, `eventos:read`                 |
| empresa       | `user:self:read`, `auth:sessions:self`, `empresas:self:read`, `empresas:self:write`, `vacantes:create`, `eventos:read`                 |

Un permiso no implementa por sí mismo un endpoint de otro módulo ni concede acceso a cualquier registro: cada operación comprueba además su alcance.

## Cuenta operativa y limpieza

`pnpm --filter api account:create` recibe JSON por entrada estándar con `email`, `password`, `name` y `role`. Exige rol habilitado y contraseña de 15–128 caracteres; imprime únicamente ID y rol. No colocar contraseñas en argumentos del proceso ni archivos versionados.

`pnpm --filter api auth:prune` elimina familias de sesión vencidas y sus renovaciones. Conservar hashes consumidos hasta ese vencimiento permite detectar reutilización. Los contadores de Redis expiran mediante TTL; este script no inicia tareas programadas.
