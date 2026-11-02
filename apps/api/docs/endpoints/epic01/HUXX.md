# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Backoffice documental · **Prefijos:** `/api/v1/registrations`, `/api/v1/email-verification`, `/api/v1/documents`, `/api/v1/applications`
**Éxito:** `{ "data": ... }`
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación agrega `fields`.

## Endpoints

- `GET /api/v1/registrations/careers` — carreras disponibles.
- `POST /api/v1/registrations/sessions` — comenzar registro.
- `GET /api/v1/registrations/sessions/:token` — vigencia del borrador.
- `POST /api/v1/email-verification/resend` — primer envío o reenvío del OTP.
- `POST /api/v1/email-verification/verify` — verificar correo.
- `POST /api/v1/documents` — cargar o reemplazar respaldo.
- `POST /api/v1/registrations/submit` — enviar solicitud.
- `GET /api/v1/applications` — bandeja · permiso: `solicitudes:read`.
- `GET /api/v1/applications/:id` — expediente · permiso: `solicitudes:read`.
- `GET /api/v1/applications/:id/document` — ubicación protegida del respaldo · permiso: `solicitudes:read`.
- `GET /api/v1/applications/:id/document/content` — contenido binario · permiso: `solicitudes:read`.
- `POST /api/v1/applications/:id/review` — dictaminar · permiso: `solicitudes:review`.
- `POST /api/v1/applications/:id/activation` — reenviar activación · permiso: `solicitudes:review`.
- `POST /api/v1/registrations/activate` — establecer contraseña y activar cuenta aprobada.
- `GET /api/v1/registrations/observed/access` — validar acceso con token de corrección.
- `POST /api/v1/registrations/observed/request-link` — solicitar nuevo enlace de corrección por C.I.
- `GET /api/v1/registrations/observed` — obtener datos del expediente observado · header: `X-Correction-Token`.
- `PATCH /api/v1/registrations/observed` — actualizar datos con control de versión optimista · header: `X-Correction-Token`.
- `POST /api/v1/registrations/observed/document` — reemplazar documento de respaldo · header: `X-Correction-Token`.
- `POST /api/v1/registrations/observed/submit` — entregar corrección de la solicitud observada · header: `X-Correction-Token`.

## Autenticación

Registro y verificación son públicos: `sessionToken` es una credencial temporal, no el UUID público del borrador. No compartirlo ni registrarlo en logs.

Backoffice usa `Authorization: Bearer <accessToken>` o la cookie del login. Las mutaciones con cookie requieren `X-CSRF-Token`. No se confía en `x-user-id`, roles ni carreras enviados por el cliente. La identidad y permisos vigentes proceden de la sesión propia. Ver [autenticación](epic01-grupoXX-huXXX.md).

Además del permiso, cada consulta o dictamen se limita a `me.scopes.careerIds`. Una solicitud ajena responde 404. Las rutas públicas comprueban origen y limitan 30 solicitudes por IP y operación cada 15 minutos con el adaptador memoria/Redis seleccionado.

---

## 1. Carreras — `GET /api/v1/registrations/careers`

**Permiso:** ninguno. **Body:** ninguno.

**Respuesta 200:** `{ "data": [{ "id": "uuid", "nombre": "Ingeniería de Sistemas" }] }`.

## 2. Comenzar registro — `POST /api/v1/registrations/sessions`

**Permiso:** ninguno.

**Body**
```json
{
  "nombres": "María",
  "apellidos": "Pérez",
  "ci": "12345678",
  "complementoCi": "",
  "expedidoEn": "CB",
  "correo": "maria@example.com",
  "telefono": "77777777",
  "carreraId": "10000000-0000-4000-8000-000000000001",
  "anioEgreso": 2025,
  "codigoSis": "202012345"
}
```

- Nombres/apellidos: 2–45 caracteres; letras, espacios, apóstrofe o guion.
- CI: 5–10 dígitos. Complemento opcional: hasta 2 caracteres alfanuméricos.
- Expedición: `LP | CB | SC | OR | PT | TJ | CH | BE | PD | EX`.
- Correo válido, hasta 254 caracteres; se normaliza a minúsculas.
- Teléfono: 8 dígitos. Carrera: UUID existente.
- Egreso: entero entre 1970 y el año actual. SIS: string de 6–9 dígitos.

**Respuesta 201:** `{ "data": { "sessionToken": "uuid", "expiresInSeconds": 7200 } }`.

**Errores:** 400 `VALIDATION_ERROR` o `INVALID_CAREER`; 409 `REGISTRATION_EXISTS`; 429 `RATE_LIMITED`.

## 3. Consultar borrador — `GET /api/v1/registrations/sessions/:token`

**Permiso:** ninguno. **Params:** token UUID del paso anterior.

**Respuesta 200:** `{ "data": { "sessionToken": "uuid", "expiresInSeconds": 7100, "isEmailVerified": false } }`.

No devuelve datos personales. **Errores:** 410 `REGISTRATION_EXPIRED` si venció, no existe o ya se envió.

## 4. Enviar código — `POST /api/v1/email-verification/resend`

**Permiso:** ninguno.

**Body:** `{ "registrationId": "<sessionToken>" }`. Este nombre conserva el contrato anterior: recibe el token temporal, no el ID interno.

**Respuesta 201**
```json
{
  "data": {
    "maskedEmail": "ma***@example.com",
    "expiresInSeconds": 600,
    "resendAvailableInSeconds": 60
  }
}
```

El correo entra en una cola persistida; el worker SMTP lo entrega normalmente en el siguiente ciclo de 5 segundos. Nunca se devuelve el código en la API.

**Errores:** 410 `REGISTRATION_EXPIRED`; 409 `EMAIL_ALREADY_VERIFIED`; 429 `RESEND_COOLDOWN`.

## 5. Verificar correo — `POST /api/v1/email-verification/verify`

**Permiso:** ninguno. **Body:** `{ "registrationId": "<sessionToken>", "code": "123456" }`.

**Respuesta 200:** `{ "data": { "verified": true } }`.

Código de 6 dígitos, 10 minutos y hasta 5 intentos por emisión. El reenvío invalida el anterior; verificar no alarga las dos horas del borrador.

**Errores:** 400 `INVALID_CODE`; 410 `CODE_EXPIRED` o `REGISTRATION_EXPIRED`; 429 `CODE_ATTEMPTS_EXCEEDED`.

## 6. Cargar respaldo — `POST /api/v1/documents`

**Permiso:** ninguno; exige borrador vigente con correo verificado.

**Body:** multipart/form-data, campos `sessionToken`, `tipoDocumento` y archivo `archivo`.

Tipos documentales: `titulo_provision_nacional | diploma_academico | certificado_egreso`.
Formatos PDF, PNG o JPG/JPEG; máximo 5 MiB (5 242 880 bytes). Se comprueban extensión y firma binaria, además del tamaño real.

**Respuesta 201**
```json
{
  "data": {
    "path": "uuid-del-archivo",
    "tipoDocumento": "certificado_egreso",
    "mimeType": "application/pdf",
    "sizeBytes": 2048,
    "originalName": "certificado.pdf"
  }
}
```

`path` es una referencia opaca, nunca una ruta física ni una URL pública. Cada borrador conserva un respaldo; reemplazarlo invalida la referencia anterior.

**Errores:** 400 `INVALID_DOCUMENT` o `DOCUMENT_REQUIRED`; 403 `EMAIL_NOT_VERIFIED`; 410 `REGISTRATION_EXPIRED`; 413 `PAYLOAD_TOO_LARGE`.

## 7. Enviar solicitud — `POST /api/v1/registrations/submit`

**Permiso:** ninguno; exige verificación y respaldo propios.

**Body**
```json
{
  "sessionToken": "uuid",
  "deseaMentor": false,
  "tipoDocumento": "certificado_egreso",
  "rutaStorage": "uuid-del-archivo",
  "sizeBytes": 2048,
  "mimeType": "application/pdf",
  "fechaIngreso": "2019-02-01",
  "fechaTitulacion": "2025-07-15"
}
```

Fechas opcionales ISO `YYYY-MM-DD`, sin futuro; ingreso no puede superar titulación. `mimeType` es opcional. El servidor coteja referencia, tipo y tamaño con el archivo realmente almacenado.

**Respuesta 201:** `{ "data": { "idSolicitud": "uuid", "estado": "PENDIENTE", "mensaje": "Solicitud registrada correctamente" } }`.

**Errores:** 400 `DOCUMENT_MISMATCH`; 409 `REGISTRATION_EXISTS`; 410 `REGISTRATION_EXPIRED`.
La operación es transaccional y vuelve a comprobar duplicados; una segunda petición no crea otra solicitud.

## 8. Bandeja — `GET /api/v1/applications`

**Permiso:** `solicitudes:read`.

**Query:** `page` entero positivo, default 1; `pageSize` 1–15, default 15; `career` nombre parcial; `status` uno de los cuatro estados; `search` nombre, apellido, CI, correo o SIS exacto; `age=within48|over48`.

**Respuesta 200:** `{ "data": { "items": [], "total": 0, "page": 1, "pageSize": 15 } }`.

Pendientes antiguos primero; después dictaminados recientes. `over48` selecciona pendientes de más de 48 horas. `within48` excluye esos pendientes vencidos. Paginación y filtros se ejecutan en PostgreSQL; una página fuera de rango devuelve lista vacía. Query inválida responde 400.

## 9. Expediente — `GET /api/v1/applications/:id`

**Permiso:** `solicitudes:read`. **Params:** UUID.

**Respuesta 200:** `{ "data": <ApplicationDetail> }`. No contiene códigos, hashes, credenciales ni bytes del documento.

**Errores:** 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `APPLICATION_NOT_FOUND`.

## 10. Ubicación del documento — `GET /api/v1/applications/:id/document`

**Permiso:** `solicitudes:read`.

**Respuesta 200:** `{ "data": { "url": "/api/v1/applications/uuid/document/content", "requiresAuthentication": true } }`; `data: null` si no hay archivo.

La ruta es relativa al origen de la API. Su lectura también exige autenticación: no es una URL pública ni un enlace de Supabase Storage.

## 11. Leer PDF/imagen — `GET /api/v1/applications/:id/document/content`

**Permiso:** `solicitudes:read`.

**Respuesta 200:** bytes con `Content-Type` real, `Content-Disposition: inline` y `Cache-Control: no-store`. Este endpoint no envuelve el archivo en JSON.

En Bruno usar Bearer. En navegador usar las cookies de sesión o fetch autenticado para construir un objeto Blob. **Errores:** 404 `DOCUMENT_NOT_FOUND`, además de los errores de autenticación.

## 12. Dictaminar — `POST /api/v1/applications/:id/review`

**Permiso:** `solicitudes:review`.

**Body**
```json
{
  "decision": "RECHAZADA",
  "category": "Documento ilegible",
  "note": "Adjunta un documento que permita verificar todos los datos."
}
```

Decisión `APROBADA | OBSERVADA | RECHAZADA`. Categoría 1–100 y nota 10–500 caracteres son obligatorias al observar o rechazar. Al aprobar se guardan ambas como null. `notifyDean: true` se rechaza: el sistema anterior tampoco tenía un destinatario institucional definido.

**Respuesta 201:** `{ "data": { "id": "uuid", "applicationId": "uuid", "decision": "RECHAZADA", "status": "RECHAZADA", "category": "Documento ilegible", "note": "...", "reviewedBy": "uuid", "reviewedAt": "ISO-8601", "notificationStatus": "EN_COLA" } }`.

Solo solicitudes PENDIENTE. Dictamen, estado y notificación se guardan juntos; revisiones concurrentes producen un éxito y un 409 `APPLICATION_ALREADY_REVIEWED`. El revisor proviene de la sesión. Al aprobar se emite un código de activación de 24 horas; la cuenta todavía no puede iniciar sesión.

## 13. Reenviar activación — `POST /api/v1/applications/:id/activation`

**Permiso:** `solicitudes:review`. **Body:** ninguno.

Para una solicitud aprobada cuya cuenta aún no se activó. Reemplaza el código y reinicia sus cinco intentos.

**Respuesta 201:** `{ "data": { "notificationStatus": "EN_COLA", "expiresInSeconds": 86400 } }`.

**Errores:** 404 `APPLICATION_NOT_FOUND`; 409 `ACTIVATION_NOT_ALLOWED`.

## 14. Activar cuenta — `POST /api/v1/registrations/activate`

**Permiso:** ninguno. **Body**
```json
{
  "applicationId": "uuid-de-la-solicitud",
  "code": "123456",
  "password": "Una contraseña nueva y personal"
}
```

Contraseña de 15–128 caracteres; nunca se utiliza el código como contraseña. Hasta 5 intentos con el código vigente.

**Respuesta 200:** `{ "data": { "activated": true } }`. Crea usuario ACTIVO, credencial Argon2id, perfil titulado y relación con la solicitud en una sola transacción. Después se utiliza el login existente; no emite una sesión automáticamente.

**Errores:** 400 `INVALID_ACTIVATION`; 410 `ACTIVATION_EXPIRED`; 429 `ACTIVATION_ATTEMPTS_EXCEEDED`; 409 `ROLE_UNAVAILABLE` si falta o está deshabilitado el rol del catálogo.

---

---

## 15. Validar acceso de corrección — `GET /api/v1/registrations/observed/access`

**Permiso:** Header `X-Correction-Token: <token>`.

**Respuesta 200:** `{ "data": { "valid": true } }`.

**Respuesta 404:** Token inválido, vencido o solicitud no observada devuelve `{ "error": { "code": "TOKEN_NOT_FOUND", "message": "El recurso solicitado no existe o no está disponible" } }`.

---

## 16. Solicitar enlace de corrección — `POST /api/v1/registrations/observed/request-link`

**Permiso:** ninguno. Rate limit: cooldown de 60s y tope diario de 5 peticiones.

**Body**
```json
{
  "ci": "12345678",
  "complemento": "",
  "expedidoEn": "CB"
}
```

**Respuesta 200 (inmediata e indistinguible):**
```json
{
  "data": {
    "message": "Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado"
  }
}
```

## 17. Obtener datos del expediente observado — `GET /api/v1/registrations/observed`

**Header requerido:** `X-Correction-Token: <token>`

**Respuesta 200:**
```json
{
  "data": {
    "id": "uuid",
    "version": 1,
    "nombres": "Carlos",
    "apellidos": "Montaño",
    "ci": "12345678",
    "complementoCi": "",
    "expedidoEn": "CB",
    "codigoSis": "202012345",
    "correo": "carlos@example.com",
    "telefono": "77777777",
    "carreraId": "uuid",
    "anioEgreso": 2024,
    "deseaMentor": true,
    "fechaTitulacion": "2024-05-10",
    "fechaIngreso": "2019-02-15",
    "observacion": {
      "categoria": "documento_ilegible",
      "justificacion": "El documento adjunto no es legible",
      "fecha": "2026-10-20T10:00:00.000Z"
    },
    "documento": {
      "id": "uuid",
      "nombre": "titulo.pdf",
      "tipoDocumento": "diploma_academico",
      "mime": "application/pdf",
      "sizeBytes": 1048576
    }
  }
}
```

## 18. Actualizar datos del expediente observado — `PATCH /api/v1/registrations/observed`

**Header requerido:** `X-Correction-Token: <token>`

**Body:**
```json
{
  "expectedVersion": 1,
  "nombres": "Carlos Alberto",
  "apellidos": "Montaño Díaz",
  "correo": "carlos.nuevo@example.com",
  "telefono": "78888888",
  "carreraId": "uuid",
  "anioEgreso": 2024,
  "deseaMentor": true,
  "fechaTitulacion": "2024-05-10",
  "fechaIngreso": "2019-02-15"
}
```

**Respuesta 200:**
```json
{
  "data": {
    "id": "uuid",
    "version": 2,
    "requiresEmailVerification": true,
    "message": "Datos actualizados. Debe verificar su nueva dirección de correo electrónico."
  }
}
```

**Respuesta 409 (Conflicto de versión optimista):**
```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "La solicitud cambió; actualiza antes de guardar"
  }
}
```

---

## 19. Reemplazar documento de respaldo observado — `POST /api/v1/registrations/observed/document`

**Header requerido:** `X-Correction-Token: <token>`

**Content-Type:** `multipart/form-data`

**Campos:**
- `file` / `archivo`: Archivo binario (PDF, PNG, JPG de máximo 5 MB).
- `tipoDocumento`: (Opcional) Tipo de documento (ej. `diploma_academico`).

**Respuesta 200:**
```json
{
  "data": {
    "id": "uuid",
    "documentoId": "uuid",
    "nombre": "titulo_actualizado.pdf",
    "tipoDocumento": "diploma_academico",
    "sizeBytes": 1048576,
    "message": "Documento de respaldo reemplazado correctamente"
  }
}
```

El documento anterior se desvincula de la solicitud actual y se marca `es_valido: false`, conservándose en base de datos para la auditoría y versiones históricas.

## 20. Entregar corrección de solicitud observada — `POST /api/v1/registrations/observed/submit`

**Header requerido:** `X-Correction-Token: <token>`

**Body:**
```json
{
  "expectedVersion": 2
}
```

**Respuesta 200:**
```json
{
  "data": {
    "id": "uuid",
    "estado": "PENDIENTE",
    "version": 3,
    "message": "Corrección entregada exitosamente"
  }
}
```

**Comportamiento:**
- Atómico e idempotente: Si la solicitud ya fue entregada y se encuentra en `PENDING` / `PENDIENTE`, responde con éxito indicando el estado actual.
- Control de concurrencia optimista: Si `expectedVersion` no coincide con la versión actual, responde `409 VERSION_CONFLICT`.
- Verificación de correo: Requiere que `correo_verificado === true` en el borrador de la solicitud; de lo contrario, responde `409 EMAIL_NOT_VERIFIED`.
- Invalidación de enlace: Invalida el token en `token_subsanacion` marcándolo como `usado: true`.

---

## Entidad `ApplicationDetail`

```json
{
  "id": "uuid",
  "code": "TIT-2026-ABC123",
  "fullName": "María Pérez",
  "firstName": "María",
  "lastName": "Pérez",
  "email": "maria@example.com",
  "ci": "12345678",
  "issuedIn": "CB",
  "sisCode": "202012345",
  "career": "Ingeniería de Sistemas",
  "careerId": "uuid",
  "status": "PENDIENTE",
  "submittedAt": "2026-10-18T20:00:00.000Z",
  "phone": "77777777",
  "graduationYear": 2025,
  "documentName": "certificado.pdf",
  "documentPath": "uuid-del-archivo",
  "documentFormat": "application/pdf"
}
```

## Casos borde

- Las cuentas, solicitudes activas y perfiles existentes bloquean duplicados por correo, SIS o CI + complemento; una solicitud rechazada permite volver a postular si no existe otra cuenta o solicitud activa.
- OBSERVADA conserva el dictamen y la observación. El backend anterior no tenía una operación para subsanar o reabrir; no se agregó un flujo de otro sprint.
- `deseaMentor` se guarda como preferencia; no habilita automáticamente al usuario como mentor.
- Borradores vencidos sin enviar y sus archivos se limpian automáticamente. Los respaldos enviados se conservan con el expediente.
- Los códigos se comparan mediante HMAC. El contenido de la cola de correo se cifra con AES-GCM y se borra tras entregar; SMTP tiene semántica de entrega al menos una vez.
- Un SMTP caído no revierte el dictamen: la notificación sigue pendiente y se reintenta cada minuto hasta su vencimiento. `EN_COLA` significa guardado para envío, no entregado.
- Todo el almacenamiento pertenece al backend y PostgreSQL. No intervienen Supabase Auth, Storage, RPC ni triggers de autenticación.
- Las rutas antiguas sin versión no son alias. El frontend se mantiene sin cambios en esta etapa y necesitará adaptar sus URLs y el tratamiento uniforme de errores al integrarlo.
