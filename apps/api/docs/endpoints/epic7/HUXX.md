# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Módulo de eventos base · **Prefijo:** `/api/v1/events`
**Éxito:** `{ "data": ... }`, excepto contenido de portadas y eliminación 204.
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación agrega `fields`.

## Endpoints

- `GET /api/v1/events/catalog` — catálogo público.
- `GET /api/v1/events/:id` — detalle de evento publicado.
- `GET /api/v1/events/owned` — eventos del creador autenticado.
- `GET /api/v1/events/owned/:id` — detalle propio en cualquier estado.
- `GET /api/v1/events/drafts/:id` — detalle propio que exige BORRADOR.
- `POST /api/v1/events` — crear evento.
- `PATCH /api/v1/events/drafts/:id` — editar borrador.
- `PATCH /api/v1/events/drafts/:id/publish` — publicar borrador.
- `PATCH /api/v1/events/:id/cancel` — cancelar evento publicado propio.
- `GET /api/v1/events/inactive` — eventos propios cancelados o finalizados que siguen en gestión activa.
- `PATCH /api/v1/events/owned/:id/retire` — retirar de la gestión activa un evento propio cancelado o finalizado (baja lógica).
- `POST /api/v1/events/covers` — cargar portada.
- `DELETE /api/v1/events/covers/:id` — eliminar portada propia sin usar.
- `GET /api/v1/events/covers/:id` — leer imagen pública o previsualización propia.
- `POST /api/v1/events/:id/registrations` — confirmar la inscripción del Titulado autenticado.

## Autenticación

La gestión requiere permiso `eventos:manage` y propiedad por usuario creador. La inscripción requiere rol `titulado`. Usar Bearer o cookies del login; las mutaciones con cookie requieren X-CSRF-Token. Los IDs de usuario, roles y cabeceras aportados por el cliente no asignan propiedad.

Catálogo y detalle publicado son públicos. Las portadas de eventos publicados también; las de borradores o cargas aún sin vincular requieren sesión del propietario y permiso de gestión. La autenticación opcional de esta lectura no hace públicos los borradores: la consulta de persistencia comprueba publicación o propiedad.

---

## 1. Catálogo — `GET /api/v1/events/catalog`

**Permiso:** ninguno. **Body:** ninguno.

**Respuesta 200:** `{ "data": [<EventItem>] }`.

Solo PUBLICADO, con fecha de fin posterior al momento actual y cupo entre 1 y 10000. Orden por fecha de inicio ascendente y UUID. Puede incluir eventos ya iniciados que aún no terminaron. Conserva el listado sin paginación del módulo anterior.

## 2. Detalle publicado — `GET /api/v1/events/:id`

**Permiso:** ninguno. **Params:** ID UUID.

**Respuesta 200:** `{ "data": <EventItem> }`. También permite consultar un evento publicado que ya terminó, como hacía el backend anterior.

**Errores:** 400 `VALIDATION_ERROR`; 404 `EVENT_NOT_FOUND` para ID inexistente o evento no publicado.

## 3. Gestión propia — `GET /api/v1/events/owned`

**Permiso:** `eventos:manage`.

**Respuesta 200:** `{ "data": [<EventItem>] }`. Todos los estados propios, creación descendente. No incluye eventos de otros administradores.

## 4. Detalle propio — `GET /api/v1/events/owned/:id`

**Permiso:** `eventos:manage`. **Params:** ID UUID.

**Respuesta 200:** `{ "data": <EventItem> }` para un evento propio en cualquier estado.

**Errores:** 404 `EVENT_NOT_FOUND` si no existe o pertenece a otro creador.

## 5. Consultar borrador — `GET /api/v1/events/drafts/:id`

**Permiso:** `eventos:manage`.

**Respuesta 200:** evento propio BORRADOR dentro de data. Permite al editor detectar que otro proceso ya publicó el evento.

**Errores:** 404 `EVENT_NOT_FOUND`; 409 `EVENT_NOT_DRAFT`.

## 6. Crear evento — `POST /api/v1/events`

**Permiso:** `eventos:manage`.

**Body**

```json
{
  "title": "Feria profesional",
  "description": "Encuentro con empresas y titulados",
  "startDate": "2027-06-01T10:00:00-04:00",
  "endDate": "2027-06-01T18:00:00-04:00",
  "maxCapacity": 100,
  "location": "Campus universitario",
  "imageUrl": "/api/v1/events/covers/uuid",
  "status": "BORRADOR"
}
```

- title: obligatorio, 1–45 caracteres tras recortar espacios, al menos una letra.
- description: opcional, máximo 20000.
- Fechas: ISO-8601 con Z u offset explícito, años entre 1900 y 2100. Fin posterior al inicio. Se devuelven normalizadas a UTC.
- maxCapacity: entero entre 1 y 10000.
- location: opcional, hasta 100.
- imageUrl: opcional o null; referencia devuelta al cargar una portada propia. No acepta URLs externas ni una portada ya vinculada a otro evento.
- status: BORRADOR por defecto; también admite PUBLICADO.

**Respuesta 201:** `{ "data": <EventItem> }`. Creador, ID y fecha de creación proceden del servidor.

**Errores:** 400 `VALIDATION_ERROR` o `INVALID_EVENT_DATES`; 404 `COVER_NOT_FOUND`; 409 `COVER_IN_USE`.

## 7. Actualizar borrador — `PATCH /api/v1/events/drafts/:id`

**Permiso:** `eventos:manage`. **Params:** UUID propio.

**Body:** formulario completo igual al de creación, sin status. Aunque el verbo es PATCH, conserva la semántica del formulario anterior: título, inicio, fin y cupo son obligatorios.

Omitir imageUrl mantiene la portada; enviarlo como null la retira. Una nueva referencia sustituye la anterior y limpia los bytes anteriores de ese evento. Omitir descripción o ubicación las deja en null.

**Respuesta 200:** evento actualizado dentro de data.

**Errores:** 404 `EVENT_NOT_FOUND` o `COVER_NOT_FOUND`; 409 `EVENT_NOT_DRAFT` o `COVER_IN_USE`.

## 8. Publicar borrador — `PATCH /api/v1/events/drafts/:id/publish`

**Permiso:** `eventos:manage`. **Body:** ninguno.

**Respuesta 200:** evento en estado PUBLICADO dentro de data.

Comprueba propiedad, estado, fechas y cupo dentro de la transacción. Dos publicaciones concurrentes producen un éxito y un 409; no se permite editar un evento publicado con la operación de borradores.

**Errores:** 404 `EVENT_NOT_FOUND`; 409 `EVENT_NOT_DRAFT`; 400 `INVALID_EVENT_DATES` o `INVALID_EVENT_CAPACITY`.

## 9. Cancelar evento publicado — `PATCH /api/v1/events/:id/cancel`

**Permiso:** `eventos:manage`. **Params:** ID UUID del evento propio.
**Body:** ninguno.

Cancela un evento propio que se encuentre en estado PUBLICADO.
La operación se ejecuta dentro de una transacción: el evento pasa a
CANCELADO y los pases QR en estado VIGENTE asociados a sus inscripciones
se invalidan con estado INVALIDADO.

No permite cancelar eventos en BORRADOR ni eventos que ya no estén
PUBLICADO.

**Respuesta 200:** `{ "data": <EventItem> }`, con `status: "CANCELADO"`.

**Errores:** 400 `VALIDATION_ERROR` para un ID inválido; 404
`EVENT_NOT_FOUND` si el evento no existe, está archivado o no pertenece
al creador autenticado; 409 `EVENT_NOT_PUBLISHED` si el evento no está
PUBLICADO.

## 10. Cargar portada — `POST /api/v1/events/covers`

**Permiso:** `eventos:manage`. **Body:** multipart/form-data con archivo en `file`.

JPG/JPEG, PNG o WebP; extensión coherente con firma binaria, máximo 5 MiB (5 242 880 bytes).

**Respuesta 201**

```json
{
  "data": {
    "id": "uuid",
    "imageUrl": "/api/v1/events/covers/uuid"
  }
}
```

La ruta es relativa al origen de la API. Puede previsualizarse con sesión propia antes de vincularla; será pública al publicar el evento.

**Errores:** 400 `COVER_REQUIRED` o `INVALID_IMAGE`; 413 `PAYLOAD_TOO_LARGE`.

## 11. Eliminar portada temporal — `DELETE /api/v1/events/covers/:id`

**Permiso:** `eventos:manage`. **Params:** UUID de portada propia.

**Respuesta 204:** sin body. Solo elimina una carga que no esté vinculada a un evento.

**Errores:** 404 `COVER_NOT_FOUND`; 409 `COVER_IN_USE`. Al cancelar la creación o descartar una carga, el frontend puede usar esta operación; no se necesita enviar la URL completa como query.

## 12. Leer portada — `GET /api/v1/events/covers/:id`

**Permiso:** público si está vinculada a un evento PUBLICADO; en otro caso, creador autenticado con `eventos:manage`.

**Respuesta 200:** bytes de imagen con Content-Type real, Content-Length, Content-Disposition inline y Cache-Control no-store. No hay sobre JSON.

**Errores:** 404 `COVER_NOT_FOUND` si no está publicada ni es propia. Los errores de infraestructura conservan el manejo centralizado de la API.

## 13. Listar eventos inactivos — `GET /api/v1/events/inactive`

**Permiso:** `eventos:manage`. **Body:** ninguno.

**Respuesta 200:** `{ "data": [<InactiveEventItem>] }`.

Devuelve los eventos propios que siguen en gestión activa (`archivado = false`) pero ya no son operativos, ordenados por fecha de inicio descendente y UUID. Un evento es inactivo cuando:

- su estado es `CANCELADO`, o
- su fecha y hora de finalización (`endDate`) ya transcurrieron.

No existe un estado persistido `FINALIZADO`: se calcula en el servidor a partir de `endDate` y se expone en el campo `inactiveStatus` como `CANCELADO` o `FINALIZADO`. Los eventos archivados no se incluyen. No aplica paginación, igual que el listado de gestión.

**Errores:** 401 si no hay sesión; 403 si falta el permiso `eventos:manage`.

## 14. Retirar evento de la gestión activa — `PATCH /api/v1/events/owned/:id/retire`

**Permiso:** `eventos:manage`. **Params:** UUID de un evento propio. **Body:** ninguno.

Retira de la gestión activa un evento propio que sea retirable, es decir, `CANCELADO` o ya finalizado. La operación se ejecuta dentro de una transacción con bloqueo del evento:

- si el evento conserva inscripciones o pases QR, se realiza una **baja lógica** (`archivado = true` y `fecha_archivado`), preservando la trazabilidad;
- si no tiene relaciones, se elimina **físicamente** el registro.

En ambos casos el evento deja de aparecer en la gestión activa y en el catálogo.

**Respuesta 200:** `{ "data": { "id": "uuid", "registrationsCount": 0, "passesCount": 0 } }`. Los conteos describen las relaciones que se conservaron al retirar.

**Errores:** 400 `VALIDATION_ERROR` para un ID inválido; 404 `EVENT_NOT_FOUND` si el evento no existe, está archivado o no pertenece al creador; 409 `EVENT_NOT_RETIRABLE` si el evento está `PUBLICADO` y aún no ha finalizado (debe cancelarse primero o esperar su finalización).
## 12. Inscribirse — `POST /api/v1/events/:id/registrations`

**Rol:** `titulado`. **Params:** UUID de evento. **Body:** ninguno.

**Respuesta 201**
```json
{
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "status": "CONFIRMADA",
    "registeredAt": "2027-06-01T14:00:00.000Z",
    "currentCapacity": 24
  }
}
```

Dentro de una transacción se bloquea el evento, se vuelve a comprobar PUBLICADO, vigencia y cupo, y se cuentan las inscripciones CONFIRMADA. El índice parcial de PostgreSQL evita una segunda confirmación del mismo usuario y evento. Un registro CANCELADA previo se conserva y permite una nueva inscripción.

**Errores:** 400 `VALIDATION_ERROR`; 404 `EVENT_NOT_FOUND`; 409 `EVENT_NOT_AVAILABLE`, `EVENT_CAPACITY_REACHED` o `EVENT_REGISTRATION_ALREADY_CONFIRMED`.

---

## Entidad `EventItem`

```json
{
  "id": "uuid",
  "title": "Feria profesional",
  "description": "Encuentro universitario",
  "startDate": "2027-06-01T14:00:00.000Z",
  "endDate": "2027-06-01T22:00:00.000Z",
  "maxCapacity": 100,
  "location": "Campus universitario",
  "imageUrl": "/api/v1/events/covers/uuid",
  "status": "PUBLICADO",
  "createdBy": "uuid",
  "creatorName": "Administración",
  "createdAt": "ISO-8601"
}
```

description, location, imageUrl y creatorName pueden ser null. Los estados reconocidos son BORRADOR, PUBLICADO y CANCELADO. La operación de cancelación permite pasar de PUBLICADO a CANCELADO; no permite cancelar un borrador. El retiro de la gestión activa se aplica a eventos CANCELADO o finalizados y no introduce un estado persistido nuevo.

## Entidad `InactiveEventItem`

`GET /api/v1/events/inactive` devuelve la entidad `EventItem` con los siguientes campos adicionales calculados en el servidor.

```json
{
  "id": "uuid",
  "title": "Feria profesional",
  "startDate": "2027-06-01T14:00:00.000Z",
  "endDate": "2027-06-01T22:00:00.000Z",
  "status": "CANCELADO",
  "createdBy": "uuid",
  "creatorName": "Administración",
  "createdAt": "ISO-8601",
  "inactiveStatus": "CANCELADO",
  "registrationsCount": 0,
  "passesCount": 0
}
```

- `inactiveStatus`: `CANCELADO` si el estado es CANCELADO; `FINALIZADO` si la fecha de fin ya transcurrió. Nunca es null en esta colección.
- `registrationsCount`: número de inscripciones vinculadas al evento.
- `passesCount`: número de pases QR vinculados a las inscripciones del evento.

Estos conteos indican si, al retirar, el evento se archivará (baja lógica) o se eliminará físicamente.

## Casos borde

- Las inscripciones CONFIRMADA reservan cupo. La cancelación y asistencia no se implementan en este módulo; una CANCELADA histórica no bloquea una nueva confirmación.
- HU3 no genera pase QR. HU10 debe asociar su pase único en una integración posterior; no se debe declarar el flujo integral de QR como completado hasta entonces.
- Se conserva el alcance previo de inscripciones, asistencia y control de cupos ocupados. La cancelación invalida los QR vigentes del evento, pero no implementa por sí sola la gestión de asistencia ni el control de plazas ocupadas. maxCapacity describe el cupo configurado, no reserva plazas.
- La portada tiene FK y un único evento asociado. El servidor no confía en una URL arbitraria para establecer propiedad.
- Los bytes se guardan en PostgreSQL con RLS; las lecturas pasan por la API. No existe un bucket público de Supabase.
- El frontend conserva sus URLs antiguas y espera varias respuestas sin sobre data. Habrá que adaptar esa integración; no se modificó en esta entrega.

## Equivalencia con el backend anterior

| Anterior                                    | Actual                                  |
| ------------------------------------------- | --------------------------------------- |
| /api/events/catalog                         | /api/v1/events/catalog                  |
| /api/events/:id                             | /api/v1/events/:id                      |
| /api/events/admin                           | /api/v1/events/owned                    |
| /api/events/admin/event/:id                 | /api/v1/events/owned/:id                |
| GET y PATCH /api/events/admin/:id           | GET y PATCH /api/v1/events/drafts/:id   |
| PATCH /api/events/admin/:id/publish         | PATCH /api/v1/events/drafts/:id/publish |
| POST /api/events/admin/cover                | POST /api/v1/events/covers              |
| DELETE /api/events/admin/cover?imageUrl=... | DELETE /api/v1/events/covers/:id        |
