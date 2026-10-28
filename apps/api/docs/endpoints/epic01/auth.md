# [epic01-auth] Autenticación e identidad

**Épica:** Identidad · **Prefijos:** `/api/v1/auth`, `/api/v1/user`  
**Éxito:** `{ "data": ... }`; operaciones sin contenido: `204`. El listado de sesiones no está paginado.  
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación añade `error.fields`.

## Endpoints

- `POST /api/v1/auth/login` — iniciar sesión.
- `POST /api/v1/auth/refresh` — rotar refresh y emitir access.
- `GET /api/v1/auth/me` — identidad actual · permiso: `user:self:read`.
- `GET /api/v1/user/me` — misma identidad desde user · permiso: `user:self:read`.
- `GET /api/v1/auth/session` — consultar sesión con refresh sin rotarlo.
- `POST /api/v1/auth/logout` — revocar sesión actual.
- `POST /api/v1/auth/logout-all` — revocar todas las sesiones propias.
- `GET /api/v1/auth/sessions` — listar sesiones propias · permiso: `auth:sessions:self`.
- `DELETE /api/v1/auth/sessions/:id` — revocar una sesión propia · permiso: `auth:sessions:self`.
- `POST /api/v1/auth/password` — cambiar contraseña y revocar todas las sesiones.

## Autenticación

- `Authorization: Bearer <accessToken>` para rutas protegidas; también se acepta la cookie HttpOnly `umsspira_token`.
- `Cookie: umsspira_refresh=...` para renovar o consultar sesión. El refresh no se devuelve en JSON.
- `X-CSRF-Token`: valor de la cookie `umsspira_csrf`. Obligatorio al renovar y en operaciones mutables autenticadas por cookies. Con bearer no se exige CSRF, salvo en refresh, que siempre usa cookie.
- El navegador debe enviar credenciales y usar un origen incluido en `CORS_ORIGINS`. No se autentica mediante `x-user-id`, `x-company-id` ni cookies de rol.
- Permisos usados: `user:self:read`, `auth:sessions:self`. Estado, rol y permisos se consultan en cada petición autenticada.

Cookies de access y refresh: HttpOnly, SameSite=Lax, ruta `/`, sin Domain y Secure en producción. La cookie CSRF es legible. `remember=false` usa cookies de sesión del navegador; `remember=true` les asigna vencimiento.

---

## 1. Iniciar sesión — `POST /api/v1/auth/login`

Verifica credenciales propias y crea una sesión revocable.

**Permiso:** ninguno; público y limitado por intentos.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body**

```json
{
  "email": "admin@umss.edu.bo",
  "password": "admin1234",
  "remember": false
}
```

- `email` — string requerido, formato email, máximo 254; se recortan espacios y se convierte a minúsculas.
- `password` — string requerido, 1–128 caracteres; no se recortan espacios.
- `remember` — boolean opcional, default `false`.
- No se admiten campos adicionales, incluidos `role` o `permissions`.

**Respuesta `200`**

```json
{
  "data": {
    "accessToken": "<JWT de acceso>",
    "role": "administrador",
    "expiresIn": 900,
    "user": {
      "id": "20000000-0000-4000-8000-000000000002",
      "email": "admin@umss.edu.bo",
      "name": "Administrador de demostración",
      "role": "administrador",
      "permissions": [
        "user:self:read",
        "auth:sessions:self",
        "solicitudes:read",
        "solicitudes:review",
        "eventos:manage",
        "reportes:read",
        "mentores:manage"
      ],
      "scopes": {
        "companyIds": [],
        "graduateId": null,
        "careerIds": [
          "10000000-0000-4000-8000-000000000001"
        ]
      }
    }
  }
}
```

Incluye tres cabeceras `Set-Cookie`: access, refresh y CSRF.

**Errores**

- `400 VALIDATION_ERROR` — body inválido.
- `401 INVALID_CREDENTIALS` — credenciales incorrectas o usuario/rol no habilitado; mismo mensaje público.
- `403 FORBIDDEN` — origen no permitido.
- `429 RATE_LIMITED` — 10 intentos por correo o 100 por IP en 15 minutos; incluye `Retry-After` en segundos.
- `503 RATE_LIMIT_UNAVAILABLE` — Redis no disponible cuando se utiliza ese adaptador.
- `503 DATABASE_UNAVAILABLE` — PostgreSQL no disponible.

---

## 2. Renovar sesión — `POST /api/v1/auth/refresh`

Consume el refresh actual y lo reemplaza por uno nuevo dentro de la misma sesión.

**Permiso:** ninguno; requiere refresh y CSRF válidos.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno. Se usan la cookie refresh y `X-CSRF-Token`.

**Respuesta `200`**

Misma estructura JSON de login, con nuevo access. Actualiza las tres cookies; el nuevo refresh sigue siendo HttpOnly.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.
- `401 SESSION_REUSED` — refresh ya consumido: se revoca toda su familia.
- `429 RATE_LIMITED` — 120 renovaciones por IP por minuto; incluye `Retry-After`.
- `503 RATE_LIMIT_UNAVAILABLE` — Redis no disponible cuando se utiliza ese adaptador.

---

## 3. Consultar identidad — `GET /api/v1/auth/me`

Devuelve la identidad verificada, los permisos y el alcance actual.

**Permiso:** `user:self:read`.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `200`**

```json
{
  "data": {
    "id": "20000000-0000-4000-8000-000000000002",
    "email": "admin@umss.edu.bo",
    "name": "Administrador de demostración",
    "role": "administrador",
    "permissions": [
      "user:self:read",
      "auth:sessions:self",
      "solicitudes:read",
      "solicitudes:review",
      "eventos:manage",
      "reportes:read",
      "mentores:manage"
    ],
    "scopes": {
      "companyIds": [],
      "graduateId": null,
      "careerIds": [
        "10000000-0000-4000-8000-000000000001"
      ]
    }
  }
}
```

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 4. Consultar identidad desde user — `GET /api/v1/user/me`

Expone el mismo contrato público de identidad desde el módulo propietario del usuario.

**Permiso:** `user:self:read`.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `200`**

Misma estructura y campos de `GET /api/v1/auth/me`.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 5. Consultar sesión para navegación — `GET /api/v1/auth/session`

Comprueba un refresh vigente sin consumirlo ni emitir tokens; permite resolver navegación del lado servidor.

**Permiso:** ninguno; requiere cookie refresh vigente y no consumida.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `200`**

Misma estructura de identidad de `GET /api/v1/auth/me`. No devuelve access ni modifica cookies.

**Errores**

- `401 UNAUTHENTICATED` — refresh inválido, consumido, vencido, sesión revocada o usuario/rol no habilitado.
- `403 FORBIDDEN` — origen no permitido.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 6. Cerrar sesión actual — `POST /api/v1/auth/logout`

Revoca la sesión autenticada y elimina sus cookies.

**Permiso:** sesión autenticada.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `204`**

Sin cuerpo. El access deja de autorizar peticiones aunque su firma y expiración sigan siendo válidas.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 7. Cerrar todas las sesiones — `POST /api/v1/auth/logout-all`

Revoca todas las sesiones del usuario autenticado, incluida la actual.

**Permiso:** sesión autenticada.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `204`**

Sin cuerpo; elimina las cookies actuales.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 8. Listar sesiones propias — `GET /api/v1/auth/sessions`

Devuelve hasta 100 sesiones activas y no vencidas del usuario, ordenadas por creación descendente.

**Permiso:** `auth:sessions:self`.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body:** ninguno.

**Respuesta `200`**

```json
{
  "data": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "current": true,
      "createdAt": "2026-10-18T12:00:00.000Z",
      "renewedAt": "2026-10-18T12:00:00.000Z",
      "expiresAt": "2026-10-19T00:00:00.000Z",
      "agent": "Cliente de demostración"
    }
  ]
}
```

El listado no incluye hashes, secretos ni tokens; `agent` puede ser null y es información declarada por el cliente.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.

---

## 9. Revocar una sesión propia — `DELETE /api/v1/auth/sessions/:id`

Revoca una sesión perteneciente al usuario autenticado.

**Permiso:** `auth:sessions:self` y propiedad de la sesión.  
**Params de ruta:** `id` (UUID válido).  
**Query:** ninguna.  
**Body:** ninguno.

**Respuesta `204`**

Sin cuerpo. Si se revoca la sesión actual, también se eliminan sus cookies.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.
- `400 VALIDATION_ERROR` — identificador inválido.
- `404 SESSION_NOT_FOUND` — sesión inexistente, ya revocada o perteneciente a otro usuario; no revela propiedad ajena.

---

## 10. Cambiar contraseña — `POST /api/v1/auth/password`

Verifica la contraseña actual, actualiza su hash y revoca todas las sesiones en una transacción.

**Permiso:** sesión autenticada y contraseña actual.  
**Params de ruta:** ninguno  
**Query:** ninguna  

**Body**

```json
{
  "currentPassword": "admin1234",
  "newPassword": "Nueva frase de acceso 2026"
}
```

- `currentPassword` — string requerido, 1–128 caracteres.
- `newPassword` — string requerido, 15–128 caracteres, distinto del actual.
- No se recortan espacios ni se admiten campos adicionales.

**Respuesta `204`**

Sin cuerpo. Elimina cookies; es necesario iniciar sesión con la nueva contraseña.

**Errores**

- `401 UNAUTHENTICATED` — token ausente, inválido, vencido o sesión revocada.
- `403 FORBIDDEN` — permiso, origen o token CSRF inválido, según la operación.
- `503 DATABASE_UNAVAILABLE` — persistencia temporalmente indisponible.
- `400 VALIDATION_ERROR` — body inválido o nueva contraseña igual a la actual.
- `401 INVALID_CREDENTIALS` — contraseña actual incorrecta.
- `409 PASSWORD_CONFLICT` — otra operación cambió las credenciales durante el proceso.
- `429 RATE_LIMITED` — cinco intentos por usuario en 15 minutos; incluye `Retry-After`.
- `503 RATE_LIMIT_UNAVAILABLE` — Redis no disponible cuando se utiliza ese adaptador.

---

## Entidad `UsuarioAutenticado`

```json
{
  "id": "20000000-0000-4000-8000-000000000002",
  "email": "admin@umss.edu.bo",
  "name": "Administrador de demostración",
  "role": "administrador",
  "permissions": [
    "user:self:read",
    "auth:sessions:self",
    "solicitudes:read",
    "solicitudes:review",
    "eventos:manage",
    "reportes:read",
    "mentores:manage"
  ],
  "scopes": {
    "companyIds": [],
    "graduateId": null,
    "careerIds": [
      "10000000-0000-4000-8000-000000000001"
    ]
  }
}
```

- `id` — UUID del usuario; no equivale al UUID de empresa o titulado.
- `email` — correo normalizado.
- `name` — nombre visible, string o null.
- `role` — `administrador | titulado | empresa`.
- `permissions` — códigos habilitados del rol actual.
- `scopes.companyIds` — UUID de empresas relacionadas.
- `scopes.graduateId` — UUID de titulado relacionado o null.
- `scopes.careerIds` — UUID de carreras con asignación administrativa ACTIVA.

## Casos borde

- Los límites son iguales con ambos adaptadores. Desarrollo/test utiliza memoria local por defecto; sus contadores se reinician con el proceso. En modo producción el valor por defecto es Redis; una demostración con una instancia puede elegir memoria explícitamente. El adaptador se selecciona al arrancar con `AUTH_RATE_LIMIT_STORE`; no se cambia silenciosamente ante una caída.

- La navbar dispone de identidad mediante `me`; puede mostrar `name` y usar `role`/`permissions` para su navegación. No necesita otro endpoint de identidad. Notificaciones y mensajes corresponden a sus propios módulos.
- El JWT dura por defecto 15 minutos. Las sesiones vencen de forma absoluta a las 12 horas, o a los 30 días con recordar; el entorno permite configurar estos tiempos. Renovar no extiende ese vencimiento.
- Una sesión se revoca al cerrar, cambiar contraseña o reutilizar un refresh consumido. Bloquear un usuario o deshabilitar su rol/permisos se refleja en la siguiente petición.
- Una firma JWT válida no evita consultar la sesión y los permisos actuales.
- Un refresh desconocido no revoca una sesión ajena. La reutilización exige un refresh previamente emitido y el CSRF de esa sesión.
- Renovaciones simultáneas con el mismo refresh pueden revocar la familia; el cliente debe serializarlas. Si se pierde la respuesta de una renovación consumida, puede ser necesario iniciar sesión otra vez.
- `503` indica infraestructura indisponible; no equivale a credenciales inválidas ni obliga a borrar la sesión del cliente.
- Todos estos endpoints responden con `Cache-Control: no-store`.
- Las claves breves de las cuentas de demostración solo se insertan mediante el seed explícito. La política de alta operativa y cambio de contraseña mantiene un mínimo de 15 caracteres.
