# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Portal Empresas Base · **Prefijo:** `/api/v1/companies`  
**Éxito:** `{ "data": ... }`  
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación añade `error.fields`.

Este reporte cubre las tres operaciones existentes de perfil migradas de `api-antigua`.

## Endpoints

- `GET /api/v1/companies/:companyId/header` — encabezado del perfil · permiso: `empresas:self:read`.
- `GET /api/v1/companies/:companyId/contact` — contacto e información institucional · permiso: `empresas:self:read`.
- `PUT /api/v1/companies/:companyId/profile` — actualizar perfil · permiso: `empresas:self:write`.

## Autenticación

- `Authorization: Bearer <accessToken>`, o cookie de acceso válida.
- Las operaciones mutables autenticadas por cookie exigen `X-CSRF-Token`.
- `companyId` debe pertenecer a `me.scopes.companyIds`. Es el UUID de empresa, no `me.id`.
- El adaptador filtra además por el usuario propietario. Un permiso no autoriza empresas ajenas.
- `x-user-id` y `x-company-id` no autentican ni amplían el alcance.

Permisos usados: `empresas:self:read`, `empresas:self:write`. El catálogo inicial los asigna al rol empresa.

---

## 1. Consultar encabezado — `GET /api/v1/companies/:companyId/header`

Devuelve los campos necesarios para el encabezado corporativo.

**Permiso:** `empresas:self:read`.  
**Params de ruta:** `companyId` (UUID).  
**Query:** ninguna.  
**Body:** ninguno.

**Respuesta `200`**

```json
{
  "data": {
    "nombre": "Empresa de demostración",
    "eslogan": null,
    "logoUrl": null,
    "bannerUrl": null
  }
}
```

**Errores**

- `400 VALIDATION_ERROR` — UUID inválido.
- `401 UNAUTHENTICATED` — sesión ausente, inválida o revocada.
- `403 FORBIDDEN` — falta de permiso o empresa fuera del scope.
- `404 COMPANY_NOT_FOUND` — empresa inexistente o propiedad ya no vigente.
- `503 DATABASE_UNAVAILABLE` — persistencia no disponible.

---

## 2. Consultar contacto — `GET /api/v1/companies/:companyId/contact`

Devuelve contacto, descripción institucional y NIT/RUC registrado.

**Permiso:** `empresas:self:read`.  
**Params de ruta:** `companyId` (UUID).  
**Query:** ninguna.  
**Body:** ninguno.

**Respuesta `200`**

```json
{
  "data": {
    "description": null,
    "taxId": null,
    "companySize": null,
    "address": null,
    "email": "empresa@umss.edu.bo",
    "phone": null,
    "website": null
  }
}
```

**Errores**

- `400 VALIDATION_ERROR` — UUID inválido.
- `401 UNAUTHENTICATED` — sesión ausente, inválida o revocada.
- `403 FORBIDDEN` — falta de permiso o empresa fuera del scope.
- `404 COMPANY_NOT_FOUND` — empresa inexistente o propiedad ya no vigente.
- `503 DATABASE_UNAVAILABLE` — persistencia no disponible.

---

## 3. Actualizar perfil — `PUT /api/v1/companies/:companyId/profile`

Actualiza los campos enviados y guarda teléfono y dirección en la misma transacción.

**Permiso:** `empresas:self:write`.  
**Params de ruta:** `companyId` (UUID).  
**Query:** ninguna.

**Body**

```json
{
  "razonSocial": "Empresa de demostración",
  "eslogan": "Tecnología y comunidad",
  "descripcionLarga": "Empresa de demostración para las pruebas del proyecto.",
  "tamanoEmpresa": "11-50",
  "sitioWeb": "https://empresa.example",
  "correo": "contacto@empresa.example",
  "telefono": "+591 72222222",
  "direccion": "Av. de demostración 123"
}
```

Todos los campos son opcionales, pero debe enviarse al menos uno. Se recortan espacios exteriores.

- `razonSocial` — string no vacío, máximo 100.
- `eslogan` — string, máximo 200; admite vacío para quitar el texto.
- `descripcionLarga` — string no vacío, máximo 2000.
- `tamanoEmpresa` — string, máximo 45; se conserva el formato libre existente.
- `sitioWeb` — URL HTTP/HTTPS, máximo 45.
- `correo` — email, máximo 254; se normaliza a minúsculas.
- `telefono` — string de 7–20 caracteres, al menos siete dígitos; admite `+` inicial, espacios y guiones.
- `direccion` — string no vacío, máximo 255.
- No admite null ni campos adicionales. `nit`, sus variantes y los identificadores de propietario no son modificables.

**Respuesta `200`**

```json
{
  "data": {
    "id": "10000000-0000-4000-8000-000000000003",
    "razon_social": "Empresa de demostración",
    "nit": null,
    "eslogan": "Tecnología y comunidad",
    "logo_url": null,
    "banner_url": null,
    "descripcion_larga": "Empresa de demostración para las pruebas del proyecto.",
    "tamano_empresa": "11-50",
    "sitio_web": "https://empresa.example",
    "correo": "contacto@empresa.example"
  }
}
```

Se conservan los nombres de campos de la respuesta anterior dentro de `data`. Teléfono y dirección actualizados se consultan mediante `contact`.

**Errores**

- `400 VALIDATION_ERROR` — body vacío, campos desconocidos, UUID o valores inválidos.
- `401 UNAUTHENTICATED` — sesión ausente, inválida o revocada.
- `403 FORBIDDEN` — falta de permiso, empresa fuera del scope o CSRF inválido.
- `404 COMPANY_NOT_FOUND` — empresa inexistente o propiedad ya no vigente.
- `409 RELATION_CONFLICT` — conflicto con registros relacionados.
- `503 DATABASE_UNAVAILABLE` — persistencia no disponible.

---

## Entidad `PerfilEmpresa`

```json
{
  "id": "10000000-0000-4000-8000-000000000003",
  "razon_social": "string | null",
  "nit": "string | null",
  "eslogan": "string | null",
  "logo_url": "string | null",
  "banner_url": "string | null",
  "descripcion_larga": "string | null",
  "tamano_empresa": "string | null",
  "sitio_web": "string | null",
  "correo": "string | null"
}
```

## Casos borde

- No se elige arbitrariamente la primera empresa del usuario. El cliente toma un UUID de `me.scopes.companyIds` y lo envía en la ruta.
- Los campos ausentes en la base se devuelven como null; una empresa inexistente produce 404.
- `PUT` conserva el comportamiento de actualización parcial existente: los campos omitidos no se borran.
- NIT/RUC es de solo lectura en este flujo. No se incorpora todavía un endpoint de alta ni una validación de registro tributario.
- Si hay varios teléfonos, se muestra primero uno de tipo PRINCIPAL; para registros antiguos sin principal se usa el primero ordenado por UUID. La actualización modifica el principal o crea uno, sin sobrescribir teléfonos de otros tipos.
- La dirección visible y actualizada es la primera ordenada por UUID. Estas operaciones no administran un listado de direcciones.
- Perfil, teléfono y dirección se confirman juntos; un fallo revierte la operación completa.
- El correo de contacto de empresa no cambia la credencial de login.
- Equivalencias de migración: `GET /api/empresa/perfil/header` → `GET /api/v1/companies/:companyId/header`; `GET /api/empresa/perfil/contacto` → `GET /api/v1/companies/:companyId/contact`; `PUT /api/empresa/perfil` → `PUT /api/v1/companies/:companyId/profile`.
- El frontend no se modifica en esta migración. Debe adaptar las rutas, el UUID explícito y el sobre `data` cuando se integre.
