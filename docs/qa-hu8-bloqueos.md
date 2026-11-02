# HU-8: bloqueos de Radar y permisos de Titulado

Rama de trabajo: `feat/G3-HU8-bloqueosRadar`, creada desde `epic3` en `d08c28ea`.

Este documento registra los dos bloqueos observados por QA y las verificaciones operativas
pendientes. La aprobación de este PR incorpora documentación y pruebas; no acredita el cierre
de BLQ-HU8-01 ni BLQ-HU8-02. Ambos requieren intervención de DevOps/BD y revalidación de QA.
No autoriza escrituras en la base compartida.

## BLQ-HU8-01: GET /api/v1/radar responde 404

El código de `epic3` registra los controladores y las dependencias del Radar:

- `apps/api/src/modules/radar/radar.module.ts` declara `GetRadarController`,
  `RecalculateRadarController`, `NlpModule`, `PrismaModule` y los adaptadores de perfil y
  keywords.
- `apps/api/src/modules/nlp/nlp.module.ts` exporta `KeywordDictionaryLoader` y
  `KeywordExtractorService`.
- `apps/api/src/app.module.ts` importa `NlpModule` y `RadarModule`.
- `apps/api/src/shared/http/configuration/configure-http.ts` aplica el prefijo `/api/v1`.

En la revisión de QA de `dev` en `22984c26`, `RadarModule` no registraba los controladores
y faltaban exportaciones de `NlpModule`. Esto es compatible con el 404 observado, pero QA
no confirmó la correspondencia entre ese commit y el despliegue. DevOps debe verificar la URL
efectiva y el commit activo antes de atribuir la causa a la versión desplegada.

La prueba de regresión ya existe en
`apps/api/test/radar-top-keywords.e2e.spec.ts`: GET y POST sin token responden 401; con token
sin permiso responden 403. Nunca se espera 404.

Acción: el Líder de Git revisa la integración de `epic3` hacia `dev`; DevOps despliega el
commit aprobado de esa integración y registra su SHA. `d08c28ea` es la referencia histórica
revisada por QA, no un objetivo fijo de despliegue. Este PR no modifica código de producción.

## BLQ-HU8-02: /auth/me sin radar:self:read, radar:self:write ni nlp:extract

`access.policy.ts` declara los tres permisos para `titulado` y `nlp:extract` para
`administrador`. `origin/dev` y `epic3` ya contienen esa política. `/auth/me` obtiene los
permisos efectivos de `rol_acceso`, `rol_permiso` y `permiso_acceso`, y descarta los
deshabilitados.

QA observó que la identidad de Titulado no devolvía los permisos de radar. La causa raíz
sigue pendiente de confirmar: DevOps/BD debe verificar la versión activa, la base conectada,
los roles y permisos habilitados y sus asociaciones. El conjunto dirigido comprende tres
permisos y cuatro asociaciones; no se presupone que todos falten en QA. No se salta el guard
ni se ejecuta `db:seed`.

### 1. Diagnóstico de solo lectura

Desde la raíz del repositorio:

```sh
pnpm --filter api exec tsx scripts/seed/grant-nlp-permissions.ts --dry-run
```

Salida esperada cuando faltan exactamente los tres permisos y las cuatro asignaciones:

```json
{
  "target": "um***-dev",
  "host": "***",
  "mode": "dry-run",
  "blocked": false,
  "plan": {
    "missingRoles": [],
    "disabledRoles": [],
    "disabledPermissions": [],
    "missingPermissions": ["nlp:extract", "radar:self:read", "radar:self:write"],
    "missingAssignments": [
      { "rol_codigo": "administrador", "permiso_codigo": "nlp:extract" },
      { "rol_codigo": "titulado", "permiso_codigo": "nlp:extract" },
      { "rol_codigo": "titulado", "permiso_codigo": "radar:self:read" },
      { "rol_codigo": "titulado", "permiso_codigo": "radar:self:write" }
    ]
  },
  "insertedPermissions": 0,
  "insertedAssignments": 0
}
```

El dry-run usa una transacción READ ONLY real. Si `blocked` es `true`, un rol o un permiso
objetivo está ausente o deshabilitado y no se debe ejecutar `--apply`.

El autor reportó un dry-run local del 29-oct-2026 con `missingPermissions` y
`missingAssignments` vacíos. Ese resultado describe la conexión local y no demuestra el
estado de la base usada por QA. DevOps/BD debe confirmar el destino real de la API; tras la
corrección operativa, QA renueva el login y comprueba `/auth/me`.

El script restringe el destino al proyecto del equipo mediante `assertTeamPermissionTarget`.
Cambiar las variables de conexión no permite ejecutarlo contra otro proyecto. Si el destino
desplegado no es el admitido, DevOps/BD debe definir un procedimiento autorizado para ese
destino; no se elimina ni se evita esta validación. Si el dry-run devuelve cero faltantes,
no se ejecuta `--apply`.

### 2. Respaldo previo

DevOps/BD exporta las dos tablas antes de escribir. El comando no imprime la cadena de
conexión:

```sh
mkdir -p backups
pg_dump "$DIRECT_URL" --data-only \
  --table=public.permiso_acceso \
  --table=public.rol_permiso \
  -f "backups/hu8-permisos-$(date +%Y%m%d%H%M%S).sql"
```

También se registra el conteo inicial real del destino. Solo como ejemplo, si hubiera 14
permisos y 19 asignaciones y faltaran exactamente las siete filas, el resultado sería 17
permisos y 23 asignaciones. No son conteos confirmados del entorno QA:

```sql
SELECT count(*) FROM public.permiso_acceso;
SELECT count(*) FROM public.rol_permiso;
```

Decisión N32: la reversión elimina solo las siete filas nuevas. No se borra ninguna fila que
ya existiera. Si el dry-run mostró menos de tres permisos ausentes, la reversión debe usar el
respaldo y comparar antes de borrar.

### 3. Alta dirigida

Solo con autorización expresa de DevOps/BD y con el respaldo verificado:

```sh
pnpm --filter api exec tsx scripts/seed/grant-nlp-permissions.ts --apply
```

El script usa una transacción SERIALIZABLE, solo inserta faltantes con
`ON CONFLICT DO NOTHING`, no ejecuta `UPDATE` y bloquea la operación si un rol o permiso
objetivo está deshabilitado. No ejecutar `db:seed` ni repetir `--apply` sin revisar el estado.

### 4. Verificación de lectura

```sql
SELECT codigo, habilitado
FROM public.permiso_acceso
WHERE codigo IN ('nlp:extract', 'radar:self:read', 'radar:self:write')
ORDER BY codigo;

SELECT rol_codigo, permiso_codigo
FROM public.rol_permiso
WHERE (rol_codigo = 'administrador' AND permiso_codigo = 'nlp:extract')
   OR (rol_codigo = 'titulado'
       AND permiso_codigo IN ('nlp:extract', 'radar:self:read', 'radar:self:write'))
ORDER BY rol_codigo, permiso_codigo;

SELECT count(*) FROM public.permiso_acceso;
SELECT count(*) FROM public.rol_permiso;
```

### 5. Reversión de las siete filas nuevas

Ejecutar solo si el dry-run confirmó que las siete filas no existían y con autorización de
DevOps/BD:

```sql
BEGIN;

DELETE FROM public.rol_permiso
WHERE (rol_codigo, permiso_codigo) IN (
  ('administrador', 'nlp:extract'),
  ('titulado', 'nlp:extract'),
  ('titulado', 'radar:self:read'),
  ('titulado', 'radar:self:write')
);

DELETE FROM public.permiso_acceso
WHERE codigo IN ('nlp:extract', 'radar:self:read', 'radar:self:write')
  AND NOT EXISTS (
    SELECT 1
    FROM public.rol_permiso rp
    WHERE rp.permiso_codigo = public.permiso_acceso.codigo
  );

COMMIT;
```

Si algún permiso ya existía antes del alta, restaurar desde el respaldo y no ejecutar el
`DELETE` de ese permiso.

## Revalidación de QA

Commit que debe estar desplegado: el commit aprobado de integración de `epic3` hacia `dev`.
Registrar URL base, commit desplegado, fecha y las respuestas obtenidas.

1. `GET /health` responde 200.
2. Login con `titulado@umss.edu.bo` y token vigente.
3. `GET /api/v1/auth/me` devuelve rol `titulado` y los permisos `nlp:extract`,
   `radar:self:read` y `radar:self:write`, además de los seis permisos previos.
4. `GET /api/v1/radar` responde 200 con datos o 403 sin permiso. Nunca 404.
5. `POST /api/v1/radar/recalculate` responde 200, 403 sin permiso o 503 sin diccionario.
   Nunca 404.
6. Verificar el contrato de HU-8: hasta cinco `topKeywords` por área, con `keyword`, `weight`,
   `frequency`, `points` y `percentage`; seis áreas en el orden de `AFFINITY_AREAS`;
   `previousAffinity` del cálculo anterior o `null` en el primero.

## Responsables

- DevOps: confirmar el destino y desplegar el commit aprobado.
- DevOps/BD: diagnosticar los permisos efectivos; aplicar solo los faltantes confirmados con
  respaldo y autorización, y registrar las filas insertadas para su eventual reversión.
- Líder de Git: revisar el PR de `epic3` hacia `dev`.
- QA: revalidar los dos bloqueos con la evidencia anterior.

## Nota para el PR de epic3 hacia dev

Pendientes operativos HU8: DevOps debe confirmar el commit desplegado y la disponibilidad de
las rutas del radar. DevOps/BD debe verificar los permisos efectivos y sus asociaciones en la
base del entorno antes de aplicar cambios. Tras el despliegue, QA debe revalidar BLQ-HU8-01 y
BLQ-HU8-02. La fusión del PR #578 incorpora pruebas y documentación; no acredita por sí sola
el cierre de estos bloqueos.

## Fuera de alcance

El adaptador web `apps/web/src/shared/services/affinity-service.ts` descarta `weighting` y
`topKeywords`, y `graduate-affinity-view.tsx` no pasa `topKeywords` a la inspección. Ese
defecto impide mostrar el aporte de las keywords en el panel de HU-8. Requiere autorización de
los code owners de `apps/web/src/shared/` y no se modifica en esta rama.
