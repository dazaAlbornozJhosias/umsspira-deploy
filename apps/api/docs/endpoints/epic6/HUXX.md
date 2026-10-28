# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Directorio mentores · **Prefijo:** `/api/v1/mentorship`
**Éxito:** `{ "data": ... }`.
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación agrega `fields`.

## Endpoints

- `GET /api/v1/mentorship/profiles` — directorio de mentores autenticado.
- `GET /api/v1/mentorship/eligibility` — elegibilidad del titulado.
- `GET /api/v1/mentorship/my-profile` — participación propia.
- `PATCH /api/v1/mentorship/my-profile/participation` — activar o desactivar.
- `GET /api/v1/mentorship/my-profile/information` — información profesional.
- `PATCH /api/v1/mentorship/my-profile/information` — guardar información.
- `DELETE /api/v1/mentorship/my-profile/information` — limpiar información.
- `GET /api/v1/mentorship/my-profile/areas` — catálogo y selección.
- `PATCH /api/v1/mentorship/my-profile/areas` — reemplazar selección.
- `GET /api/v1/mentorship/interests/catalog` — intereses de áreas seleccionadas.
- `GET /api/v1/mentorship/interests/mine` — intereses propios.
- `POST /api/v1/mentorship/interests` — agregar intereses.
- `DELETE /api/v1/mentorship/interests/:id` — quitar un interés.
- `GET /api/v1/mentorship/availability` — disponibilidad propia.
- `PATCH /api/v1/mentorship/availability` — cambiar disponibilidad.
- `PATCH /api/v1/mentorship/profiles/:id/deactivate` — desactivar desde administración.

## Autenticación

El directorio y el perfil detallado requieren sesión autenticada. Las operaciones propias requieren `mentores:self:write`; administración requiere `mentores:manage`.

Usar Bearer del login o cookies de sesión. Las mutaciones autenticadas con cookies requieren `X-CSRF-Token`. No se aceptan headers de identidad como mecanismo de autenticación. El actor debe tener cuenta activa y un titulado asociado para participar. Usuario, titulado y mentor tienen UUID distintos.

Errores comunes: 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 400 `VALIDATION_ERROR`, 404 `MENTOR_NOT_FOUND`. Los cuerpos son estrictos: campos no declarados producen 400.

---

## 1. Directorio — `GET /api/v1/mentorship/profiles`

**Autenticación:** sesión válida requerida. **Query:** `offset` opcional (por defecto `0`) y `limit` opcional (entre `1` y `100`). Sin `limit`, devuelve el conjunto completo para compatibilidad con clientes existentes.
**Respuesta 200:** `{ "data": [<DirectoryMentor>], "total": 9, "catalog": [...] }`.

Incluye solo perfiles activos, de cuentas activas, cuyo último estado de disponibilidad es `AVAILABLE`. Ordena por creación descendente y UUID ascendente. Cada perfil incluye áreas técnicas, intereses activos asociados, y la experiencia laboral vigente más reciente (o la más reciente por fecha de inicio) como cargo y empresa. `catalog` contiene áreas raíz e intereses activos del catálogo existente. No expone correo, CI, ID de usuario ni información relevante privada. Una consulta sin coincidencias responde `200` con `data: []` y `total: 0`.
Solo perfiles activos con cuenta de titulado activa. Excluye NO_DISPONIBLE; EN_PAUSA y disponibilidad sin configurar permanecen visibles. Áreas raíz activas, orden por creación descendente y UUID. No expone correo, CI, ID de usuario ni información relevante privada.

## 2. Elegibilidad — `GET /api/v1/mentorship/eligibility`

**Permiso:** `mentores:self:write`.
**Respuesta 200:** `{ "data": { "eligible": true } }`.

Consulta la existencia de un titulado asociado a una cuenta activa. No crea perfiles ni modifica participación.

## 3. Participación propia — `GET /api/v1/mentorship/my-profile`

**Permiso:** `mentores:self:write`.
**Respuesta 200:** `{ "data": <Mentor> }`, incluso si está inactivo.
**Errores:** 404 `MENTOR_NOT_FOUND` si todavía no se activó por primera vez.

## 4. Cambiar participación — `PATCH /api/v1/mentorship/my-profile/participation`

**Permiso:** `mentores:self:write`.

**Body**

```json
{
  "esta_activo": true,
  "experiencia": "Desarrollo de aplicaciones",
  "anios_exp": 3
}
```

- `esta_activo`: boolean requerido.
- `experiencia`: string opcional, máximo 5000 caracteres.
- `anios_exp`: entero opcional entre 0 y 80.

**Respuesta 200:** `{ "data": <Mentor> }`. La primera activación crea un perfil; las siguientes reutilizan su UUID. Desactivar conserva áreas, intereses y disponibilidad, e ignora los cambios de experiencia/años del body.

**Errores:** 403 `MENTOR_NOT_ELIGIBLE`; 404 `MENTOR_NOT_FOUND` al desactivar un perfil que nunca existió.

## 5. Leer información — `GET /api/v1/mentorship/my-profile/information`

**Permiso:** `mentores:self:write`.
**Respuesta 200:** `{ "data": { "exists": true, "profile": <MentorInformation> } }`.
Sin perfil o sin información: `{ "data": { "exists": false, "profile": null } }`.

## 6. Guardar información — `PATCH /api/v1/mentorship/my-profile/information`

**Permiso:** `mentores:self:write`.

**Body**

```json
{
  "descripcion": "Mentoría en desarrollo profesional",
  "experiencia": "Experiencia en equipos de software",
  "informacion_relevante": "Información complementaria",
  "foto_perfil": "https://ejemplo.org/foto.jpg",
  "anios_exp": 3
}
```

- `experiencia`: requerido, entre 1 y 800 caracteres.
- `descripcion`: opcional, máximo 500.
- `informacion_relevante`: opcional/null, máximo 500.
- `foto_perfil`: URL HTTP/HTTPS opcional/null, máximo 2048. Solo referencia; no carga ni descarga archivos.
- `anios_exp`: opcional, entero 0–80.

**Respuesta 200:** información dentro de `data.exists/profile`. Los campos descriptivos omitidos se limpian; omitir años conserva su valor.
**Errores:** 404 `MENTOR_NOT_FOUND`. No exige participación activa para editar información.

## 7. Limpiar información — `DELETE /api/v1/mentorship/my-profile/information`

**Permiso:** `mentores:self:write`.
**Respuesta 200:** `{ "data": { "exists": false, "profile": null } }`.

Limpia descripción, experiencia, información relevante y foto. Conserva participación, años, áreas y disponibilidad.
**Errores:** 404 `MENTOR_NOT_FOUND`.

## 8. Consultar áreas — `GET /api/v1/mentorship/my-profile/areas`

**Permiso:** `mentores:self:write`. Requiere mentor activo.
**Respuesta 200**

```json
{
  "data": {
    "areas": [{ "id": "uuid", "nombre": "Tecnología", "descripcion": null }],
    "selectedIds": ["uuid"],
    "intereses": [{ "id_area": "uuid-del-area-padre", "nombre": "Desarrollo de software" }]
  }
}
```

`descripcion` es null porque el catálogo actual no tiene esa columna.
**Errores:** 404 `MENTOR_NOT_FOUND`; 403 `MENTOR_INACTIVE`.

## 9. Reemplazar áreas — `PATCH /api/v1/mentorship/my-profile/areas`

**Permiso:** `mentores:self:write`. Requiere mentor activo.
**Body:** `{ "areaIds": ["uuid"] }`, entre uno y cinco UUID; repetidos se deduplican.
**Respuesta 200:** mismo contrato de la consulta de áreas.

Solo áreas raíz activas. Quitar un área también quita sus intereses en la misma transacción; las selecciones de otras áreas se conservan.
**Errores:** 400 `AREA_INVALID`; 403 `MENTOR_INACTIVE`; 404 `MENTOR_NOT_FOUND`.

## 10. Catálogo de intereses — `GET /api/v1/mentorship/interests/catalog`

**Permiso:** `mentores:self:write`.
**Respuesta 200**

```json
{
  "data": [
    {
      "area": { "id": "uuid", "nombre": "Tecnología" },
      "intereses": [
        {
          "id": "uuid",
          "nombre": "Desarrollo de software",
          "area": { "id": "uuid", "nombre": "Tecnología" },
          "seleccionado": false
        }
      ]
    }
  ]
}
```

Solo hijos activos de áreas raíz activas seleccionadas. Sin áreas devuelve `[]`.
**Errores:** 404 `MENTOR_NOT_FOUND`.

## 11. Intereses propios — `GET /api/v1/mentorship/interests/mine`

**Permiso:** `mentores:self:write`.
**Respuesta 200:** `{ "data": [<MentorInterest>] }`. Orden por área y nombre; conserva visibles selecciones históricas aunque el catálogo se desactive.
**Errores:** 404 `MENTOR_NOT_FOUND`.

## 12. Agregar intereses — `POST /api/v1/mentorship/interests`

**Permiso:** `mentores:self:write`.
**Body:** `{ "ids": ["uuid"] }`, de uno a cien UUID.
**Respuesta 201:** `{ "data": [<MentorInterest>] }`, únicamente los agregados.

Cada interés debe estar activo, tener área raíz activa y pertenecer a un área seleccionada. La operación completa es atómica.
**Errores:** 400 `INTEREST_INVALID`; 403 `INTEREST_AREA_NOT_SELECTED`; 409 `INTEREST_ALREADY_SELECTED` para repetidos en el body o ya seleccionados; 404 `MENTOR_NOT_FOUND`.

## 13. Quitar interés — `DELETE /api/v1/mentorship/interests/:id`

**Permiso:** `mentores:self:write`. **Params:** ID UUID del interés.
**Respuesta 200:** `{ "data": { "id": "uuid", "eliminado": true } }`.
**Errores:** 400 `INTEREST_INVALID` para áreas raíz; 404 `INTEREST_NOT_FOUND`, `INTEREST_NOT_SELECTED` o `MENTOR_NOT_FOUND`. No permite modificar otro perfil.

## 14. Consultar disponibilidad — `GET /api/v1/mentorship/availability`

**Permiso:** `mentores:self:write`. Requiere mentor activo.
**Respuesta 200:** `{ "data": { "availabilityStatus": "DISPONIBLE", "fecha_actualizacion": "2026-10-18" } }`.

Sin configurar, ambos campos son null; la lectura no escribe en la BD.
**Errores:** 403 `MENTOR_INACTIVE`; 404 `MENTOR_NOT_FOUND`.

## 15. Cambiar disponibilidad — `PATCH /api/v1/mentorship/availability`

**Permiso:** `mentores:self:write`. Requiere mentor activo.
**Body:** `{ "availabilityStatus": "EN_PAUSA" }`; admite DISPONIBLE, EN_PAUSA o NO_DISPONIBLE.
**Respuesta 200:** mismo contrato de consulta. Repetir el estado conserva la fecha anterior.
**Errores:** 400 `VALIDATION_ERROR`; 403 `MENTOR_INACTIVE`; 404 `MENTOR_NOT_FOUND`.

## 16. Desactivar mentor — `PATCH /api/v1/mentorship/profiles/:id/deactivate`

**Permiso:** `mentores:manage`. **Params:** UUID del mentor, no del usuario.
**Body:** ninguno.
**Respuesta 200:** `{ "data": <Mentor> }` con `esta_activo: false`.

El titulado del mentor debe pertenecer a una carrera asignada al administrador.
**Errores:** 404 `MENTOR_NOT_FOUND` tanto si no existe como si queda fuera del alcance.

---

## 17. Perfil detallado — `GET /api/v1/mentorship/profiles/:id`

**Permiso:** sesión iniciada (cualquier rol). **Body/query:** ninguno. `:id` es el UUID del mentor que entrega el directorio.
**Respuesta 200:** `{ "data": <MentorProfile> }`. Las claves siguen el contrato que consume el front de la HU 6.9 (`features/mentorship/model/mentor-detail.ts`).

```json
{
  "id": "uuid",
  "fullName": "María Pérez",
  "photoUrl": null,
  "jobTitle": "Backend Developer",
  "company": "Acme",
  "about": "Mentora backend",
  "experience": "Desarrollo de APIs",
  "relevantInfo": null,
  "technicalAreas": ["Backend"],
  "interests": [{ "area": "Backend", "items": ["NestJS"] }],
  "availability": "AVAILABLE",
  "weekLabel": "Del 23 al 29 oct · sesiones de 1 hora",
  "slots": [{ "date": "2026-10-27", "dayLabel": "martes 27 oct", "times": ["18:00", "19:00"] }]
}
```

- Mismo filtro que el directorio para perfil y cuenta: perfil activo y cuenta de titulado activa. Un mentor UNAVAILABLE no es accesible por URL (404).
- `availability` es `AVAILABLE`, `PAUSED` o `null` (sin configurar). Solo AVAILABLE puede recibir solicitudes; en los demás casos `slots` llega vacío.
- `about`, `experience` y `relevantInfo` son la descripción, experiencia e información relevante de la HU 6.5; los textos vacíos llegan como `null`. `jobTitle` y `company` vienen de la experiencia laboral actual del titulado (o la más reciente).
- `technicalAreas` e `interests` solo incluyen áreas e intereses activos, ordenados por nombre; los intereses se agrupan por área.
- `slots` cubre los próximos 7 días en hora de Bolivia (`America/La_Paz`), desde hoy. Cada rango activo de `espacio_disponible_mentor` se divide en sesiones de 1 hora; se omiten las horas de hoy que ya pasaron, los bloques ocupados por solicitudes PENDIENTE o ACEPTADO y los días sin horas libres.
- `dia_semana`: 1 = lunes … 7 = domingo; 0 también se interpreta como domingo. Las horas se guardan y se devuelven como hora local `HH:mm`, sin conversión de zona.
- No expone correo, teléfono, CI ni los ID de usuario o titulado.

**Errores:** 401 `UNAUTHENTICATED`; 400 `VALIDATION_ERROR` si el ID no es UUID; 404 `MENTOR_NOT_FOUND` si el perfil no existe, está inactivo o no disponible.

---

## Entidad `Mentor`

```json
{
  "id": "uuid",
  "experiencia": "Experiencia profesional",
  "esta_activo": true,
  "anios_exp": 3,
  "fecha_creacion": "2026-10-18",
  "fecha_actualizacion": "2026-10-18"
}
```

Experiencia, años y fechas pueden ser null. DirectoryMentor agrega nombre, descripcion, foto_perfil, areas y availabilityStatus. MentorInformation contiene descripcion, experiencia, informacion_relevante, foto_perfil, anios_exp y fecha_actualizacion. MentorInterest contiene id, nombre y area con id/nombre.

## Casos borde

- Los cambios del mismo mentor se serializan por titulado. No se crean varios perfiles por activar concurrentemente.
- Desactivar no elimina información; reactivar conserva el estado de disponibilidad anterior.
- PAUSED no aparece en el directorio, pero su perfil detallado sigue accesible por URL sin horarios; aceptar solicitudes exige AVAILABLE y perfil/cuenta activos.
- EN_PAUSA permanece en el directorio; aceptar solicitudes exige DISPONIBLE y perfil/cuenta activos.
- La seed de demostración agrega dos áreas raíz y tres intereses sin sobreescribir filas existentes: `pnpm --filter api db:seed:demo`.
- La ruta antigua POST eligibility ahora es GET. La desactivación recibe UUID del mentor.
- No se migraron las utilidades de prueba status y profiles/reset. Salud está en /health.
- El frontend aún utiliza rutas antiguas y algunas respuestas sin data; debe integrarse con este contrato.
