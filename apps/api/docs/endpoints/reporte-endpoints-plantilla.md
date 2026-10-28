# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** [nombre] · **Prefijo:** `/api/[prefijo]`
**Éxito:** `{ "data": ... }` (listados: + `total`, `page`, `limit`)
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`

## Endpoints

- `GET /api/[prefijo]/...` — [descripción]
- `POST /api/[prefijo]/...` — [descripción] · permiso: `[permiso]`

## Autenticación

Headers requeridos y permisos de toda la HU (omitir si no aplica):

- `x-company-id` (opcional): UUID de empresa
- `x-user-id` (requerido en rutas con permiso): UUID de usuario

Permisos usados: `[permiso:accion]`

---

## 1. [Nombre de la acción] — `MÉTODO /ruta`

[Una línea: qué hace.]

**Permiso:** `[permiso]` o ninguno
**Params de ruta:** `id` (uuid)
**Query:** `page` (opcional, default 1), `limit` (opcional, default 20)

**Body**
```json
{
  "campo": "ejemplo",
  "monto": 0
}
```
- `campo` — string, requerido, máx. 500
- `monto` — number, requerido, >= 0, en [centavos/bolivianos]
- `estado` — `valor1 | valor2`, opcional

**Respuesta `201`**
```json
{ "data": { "id": "uuid", "campo": "ejemplo" } }
```

**Errores**
- `400 INVALID_PAYLOAD` — falla de validación
- `404 [RECURSO]_NOT_FOUND` — no existe
- `401 UNAUTHENTICATED` — falta token/header
- `403 FORBIDDEN` — sin permiso

<!-- Repetir sección por cada endpoint -->

---

## Entidad `[Nombre]`

```json
{
  "id": "uuid",
  "campo": "string",
  "estado": "valor1 | valor2",
  "createdAt": "date",
  "updatedAt": "date | null"
}
```

## Casos borde

Solo lo que el frontend no pueda deducir: reglas calculadas por el backend, unidades, límites de query (¿400 o se ajusta?), relaciones expandidas o solo IDs, paginación fuera de rango.

- [ítem]