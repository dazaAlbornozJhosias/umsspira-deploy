# Revisión del catálogo de HU-1

Decisiones N28, N29 y N30 del Planning v3.5. Este documento no autoriza escrituras.

## Conservación de áreas y diccionario

seedAreas crea UUID faltantes en una transacción y reproduce los diez valores de la copia.
Usa update: {} para conservar nombres, padres, estados y fechas de registros existentes,
incluso si difieren del catálogo. Las etiquetas largas son responsabilidad de
AFFINITY_AREA_LABELS en shared-types (T3.3); no se guardan en area.nombre en este ajuste.

RADAR_DICTIONARY define 66 términos canónicos, 70 asociaciones y 89 alias normalizados únicos.
Los alias incluyen 66 identidades canónicas y 23 variantes adicionales. Se propone regenerar
el anexo A desde el código, indicando canónica, alias, identidad/variante y área/peso, y revisarlo
con BD/QA. No se modifica el planning automáticamente.

El seed sincroniza pesos de asociaciones con radar-catalog.ts; no reactiva ni sobrescribe
keywords o alias existentes. El anexo B está cubierto por los tests del extractor.

## Alta dirigida T1.9

Desde la raíz del repositorio, solo lectura por defecto:

```powershell
pnpm --filter api exec tsx scripts/seed/grant-nlp-permissions.ts
pnpm --filter api exec tsx scripts/seed/grant-nlp-permissions.ts --dry-run
```

Usa DIRECT_URL, valida que corresponde a la copia del equipo y nunca la imprime. Si existe
DATABASE_URL, debe identificar también la copia. Inicia READ ONLY explícitamente y comprueba
transaction_read_only: el pooler puede ignorar opciones de conexión.

Objetivo: nlp:extract para administrador y titulado; radar:self:read y radar:self:write para
titulado. No crea roles ni reconstruye asignaciones ajenas.

Solo tras autorización expresa y verificación de respaldo y destino:

```powershell
pnpm --filter api exec tsx scripts/seed/grant-nlp-permissions.ts --apply
```

Apply usa una transacción SERIALIZABLE. Bloquea para lectura roles y permisos existentes;
un rol ausente/deshabilitado o permiso objetivo deshabilitado bloquea toda la operación.
Solo inserta faltantes mediante ON CONFLICT DO NOTHING y verifica antes de confirmar.
No hay UPDATE ni reactivaciones. Los errores revierten el bloque y solo informan la etapa.

La idempotencia se limita al conjunto dirigido. Repetir apply puede restituir una de las cuatro
asignaciones objetivo eliminada después; no debe usarse sin revisar decisiones manuales.
Los conflictos concurrentes requieren diagnóstico antes de repetir.

## Etapas N30

Acceso, catálogos auxiliares, áreas y diccionario tienen transacciones independientes.
Un fallo detiene etapas posteriores e informa cuál falló, sin detalles privados del driver.
Las etapas ya confirmadas permanecen: el seed completo no es una transacción única.

seedAccessCatalog conserva su semántica: reconstruye todas las asignaciones declaradas en
ROLE_PERMISSIONS con createMany/skipDuplicates. No usar el seed completo para T1.9.

## Verificación y revisiones

Pruebas unitarias: idempotencia, rollback, permisos deshabilitados, conservación de datos
ajenos y errores por etapa, con dobles sin conexión PostgreSQL.

Integración PostgreSQL opt-in, exclusivamente READ ONLY, desde apps/api:

```powershell
$env:RUN_NLP_PERMISSIONS_READONLY_TEST = 'true'
pnpm exec jest --runInBand --testPathPattern=nlp-permissions.integration
```

Lee el archivo local del API porque test/setup.ts sustituye las variables de conexión.
Valida el destino y compara roles/permisos/asignaciones antes y después del dry-run.
No prueba INSERT contra la copia. La prueba real de apply requiere autorización posterior.

DevOps/BD revisa seed y migración; el Líder de Git revisa el PR hacia epic3; seguridad revisa
access.policy.ts. CODEOWNERS gobierna shared-types y src/shared.
