# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Estudios de Vacantes · **Prefijo:** `/api/v1/job-postings`  
**Éxito:** `{ "data": ... }`  
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación añade `error.fields`.

Este reporte cubre la operación existente de publicación migrada de `api-antigua`.

## Endpoints

- `POST /api/v1/job-postings` — publicar vacante de una empresa propia · permiso: `vacantes:create`.

## Autenticación

- `Authorization: Bearer <accessToken>`, o cookie de acceso válida.
- Con cookie, se exige `X-CSRF-Token`.
- El UUID de empresa debe estar en `me.scopes.companyIds`; la persistencia verifica además el propietario al conectar la vacante con esa empresa.
- `x-user-id` y `x-company-id` no autentican ni sustituyen la comprobación de propiedad.

Permisos usados: `vacantes:create`. El catálogo inicial lo asigna al rol empresa; administrador no recibe este permiso automáticamente.

---

## 1. Publicar vacante — `POST /api/v1/job-postings`

Guarda una vacante en PostgreSQL con estado PUBLICADO y fecha definida por el servidor.

**Permiso:** `vacantes:create` y empresa propia.  
**Params de ruta:** ninguno.  
**Query:** ninguna.

**Body**

```json
{
  "empresaId": "10000000-0000-4000-8000-000000000003",
  "titulo": "Desarrollador de software",
  "modalidad": "REMOTO",
  "nivelExperiencia": "Junior",
  "descripcionTecnica": "Desarrollo de aplicaciones con TypeScript, pruebas y trabajo en equipo."
}
```

- `empresaId` — UUID requerido, obtenido de los scopes verificados.
- `titulo` — string requerido, no vacío, máximo 150.
- `modalidad` — `PRESENCIAL | HIBRIDO | REMOTO`, requerido.
- `nivelExperiencia` — string requerido, no vacío, máximo 100.
- `descripcionTecnica` — string requerido, de 50 a 20000 caracteres.
- Se recortan espacios exteriores de los textos.
- No se aceptan campos adicionales: propietario, estado, fecha e identificador de la vacante los determina el servidor.

**Respuesta `201`**

```json
{
  "data": {
    "id": "30000000-0000-4000-8000-000000000001",
    "titulo": "Desarrollador de software",
    "modalidad": "REMOTO",
    "nivelExperiencia": "Junior",
    "descripcionTecnica": "Desarrollo de aplicaciones con TypeScript, pruebas y trabajo en equipo.",
    "estado": "PUBLICADO",
    "fechaCreacion": "2026-10-18T12:00:00.000Z",
    "empresaId": "10000000-0000-4000-8000-000000000003"
  }
}
```

**Errores**

- `400 VALIDATION_ERROR` — UUID, modalidad, longitud o campos del body inválidos.
- `401 UNAUTHENTICATED` — sesión ausente, inválida o revocada.
- `403 FORBIDDEN` — falta de permiso, empresa fuera del scope o CSRF inválido.
- `404 COMPANY_NOT_FOUND` — empresa inexistente o propiedad ya no vigente.
- `409 RELATION_CONFLICT` — conflicto con registros relacionados.
- `503 DATABASE_UNAVAILABLE` — persistencia no disponible.

---

## Entidad `VacantePublicada`

```json
{
  "id": "UUID",
  "titulo": "string",
  "modalidad": "PRESENCIAL | HIBRIDO | REMOTO",
  "nivelExperiencia": "string",
  "descripcionTecnica": "string",
  "estado": "PUBLICADO",
  "fechaCreacion": "fecha ISO 8601",
  "empresaId": "UUID de empresa"
}
```

## Casos borde

- `empresaId` no es el UUID del usuario. Se comprueba el permiso y el scope antes de escribir; Prisma conecta además por empresa y propietario.
- El estado inicial es siempre PUBLICADO; el body no permite elegir CERRADO.
- La respuesta expone únicamente campos públicos y serializa la fecha como ISO 8601.
- Se utiliza la tabla `vacante` ya existente; no se crea una tabla paralela ni un esquema de Prisma por módulo.
- La integración Elasticsearch no existe en el backend de referencia y no se simula aquí. Tampoco se añaden búsqueda, edición, cierre ni eliminación de vacantes.
- La repetición de un POST válido publica otra vacante; no se introduce un contrato de idempotencia nuevo.
- Equivalencia de migración: `POST /api/vacantes` → `POST /api/v1/job-postings`. El body añade `empresaId` explícito y la respuesta se envuelve en `data`.
- El frontend se mantiene sin cambios y deberá adaptar ese contrato cuando se integre.
