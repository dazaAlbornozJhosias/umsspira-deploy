# Rutas de la Épica 6 — Mentorías

**Épica:** Directorio de mentores · **Prefijo API:** `/api/v1/mentorship` · **Prefijo web:** `/mentorship`
**Éxito:** `{ "data": ... }`. **Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; la validación agrega `fields`.
**Detalle contractual:** los endpoints de directorio y perfil detallado exponen `availabilityStatus`/`availability` en inglés (`AVAILABLE | PAUSED | UNAVAILABLE`, ver `@umsspira/shared-types`), mientras que los endpoints de configuración de disponibilidad usan español (`DISPONIBLE | EN_PAUSA | NO_DISPONIBLE`). Los archivos de ejemplo viven en `bruno/`.

---

## 1. Rutas de backend — API

### 1.1 Directorio y perfil público (HU 6.7 directorio · 6.8 filtros · 6.9 detalle)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/mentorship/profiles` | sesión | Directorio paginado (`offset`/`limit`). Solo mentores activos cuyo último estado es `AVAILABLE`. El controller usa `@All('profiles')`: cualquier otro método responde 405. |
| `GET` | `/api/v1/mentorship/profiles/filter` | `mentores:self:write` | Directorio filtrado por áreas e intereses (OR dentro de cada grupo, AND entre grupos). |
| `GET` | `/api/v1/mentorship/filter-options` | `mentores:self:write` | Catálogo de áreas e intereses para poblar los filtros. |
| `GET` | `/api/v1/mentorship/profiles/:id` | sesión | Perfil detallado del mentor. Responde 404 si el último estado es `NO_DISPONIBLE`. |
| `GET` | `/api/v1/mentorship/profiles/:id/slots` | `mentores:self:write` | Horarios libres del mentor para los próximos 7 días. |

### 1.2 Participación y perfil propio del mentor

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/mentorship/my-profile` | `mentores:self:write` | Participación propia (estado del mentor y requisitos de activación). |
| `PATCH` | `/api/v1/mentorship/my-profile/participation` | `mentores:self:write` | Activar o desactivar la participación como mentor. |
| `GET` | `/api/v1/mentorship/my-profile/information` | `mentores:self:write` | Leer información profesional. |
| `PATCH` | `/api/v1/mentorship/my-profile/information` | `mentores:self:write` | Guardar información profesional. |
| `DELETE` | `/api/v1/mentorship/my-profile/information` | `mentores:self:write` | Limpiar información profesional. |
| `GET` | `/api/v1/mentorship/my-profile/areas` | `mentores:self:write` | Catálogo de áreas y selección actual. |
| `PATCH` | `/api/v1/mentorship/my-profile/areas` | `mentores:self:write` | Reemplazar la selección de áreas. |
| `GET` | `/api/v1/mentorship/interests/catalog` | `mentores:self:write` | Intereses de las áreas seleccionadas. |
| `GET` | `/api/v1/mentorship/interests/mine` | `mentores:self:write` | Intereses propios. |
| `POST` | `/api/v1/mentorship/interests` | `mentores:self:write` | Agregar intereses. |
| `DELETE` | `/api/v1/mentorship/interests/:id` | `mentores:self:write` | Quitar un interés. |
| `GET` | `/api/v1/mentorship/availability` | `mentores:self:write` | Disponibilidad propia (vocabulario en español). |
| `PATCH` | `/api/v1/mentorship/availability` | `mentores:self:write` | Cambiar disponibilidad: `DISPONIBLE`, `EN_PAUSA` o `NO_DISPONIBLE`. |

### 1.3 Solicitudes de mentoría (HU 6.10 y bandeja de recibidas)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/mentorship/requests` | `mentores:self:write` | Crear solicitud de mentoría (bloque de 1 hora dentro de los slots del mentor). |
| `GET` | `/api/v1/mentorship/requests?estado=…` | sesión | Solicitudes recibidas por el mentor (estado por defecto `PENDIENTE`). |
| `GET` | `/api/v1/mentorship/requests/:id` | sesión | Detalle de una solicitud recibida. |
| `PATCH` | `/api/v1/mentorship/requests/:id/accept` | sesión | Aceptar solicitud. |
| `PATCH` | `/api/v1/mentorship/requests/:id/reject` | sesión | Rechazar solicitud. |

> Las rutas de solicitudes no declaran `@RequirePermissions`: el caso de uso valida que el actor sea el mentor dueño y re-filtra por alcance en el repositorio.

### 1.4 Resto de operaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/mentorship/eligibility` | `mentores:self:write` | Elegibilidad del titulado para solicitar mentorías. |
| `PATCH` | `/api/v1/mentorship/profiles/:id/deactivate` | `mentores:manage` | Desactivación administrativa de un mentor (limitada a las carreras de la sesión). |

---

## 2. Rutas de frontend — páginas (`apps/web/src/app/(dashboard)/mentorship/…`)

| Ruta | Pantalla | Componente |
|---|---|---|
| `/mentorship` | Inicio de mentorías | `explore-card` + `active-mentor-requests-link` |
| `/mentorship/directory` | Directorio de mentores | `mentor-directory-page` |
| `/mentorship/mentors/[mentorId]` | Perfil del mentor | `mentor-detail-page` |
| `/mentorship/request/[mentorId]` | Solicitar mentoría | `mentorship-request-flow` |
| `/mentorship/requests` | Mis solicitudes | placeholder ("próxima versión") |
| `/mentorship/requests/received` | Solicitudes recibidas | `received-requests` |
| `/mentorship/profile` | Mi perfil de mentor | `mentor-profile` |
| `/mentorship/profile/information` | Información profesional | `mentor-profile-info-page` |
| `/mentorship/profile/areas` | Áreas técnicas | `mentor-areas-page` |
| `/mentorship/profile/interests` | Intereses | `mentor-interests-connected` |
| `/mentorship/profile/availability` | Disponibilidad | `mentor-availability-page` |

---

## 3. Notas de integración

- **Comunicación**: las pantallas consumen `/api/v1/mentorship/*` a través del proxy `apps/web/src/app/api/v1/[...path]/route.ts` (`apiUrl()`); el namespace `mentorship` ya está en el allowlist `MODULES`. Las mutaciones autenticadas requieren el header `X-CSRF-Token`.
- **Sesión**: los clientes usan `authenticatedFetch` de `@/shared/services/auth-session`; el directorio exige sesión y nunca consulta la API de forma anónima.
- **Protección de rutas web**: `/mentorship/:path*` **no** está registrado en el `matcher` de `apps/web/src/middleware.ts` ni en `route-access.ts`, por lo que a nivel de router las páginas son públicas: la exigencia de sesión la impone la API. Para blindarlas como `/surveys` o `/reports` deben registrarse en ambos archivos.
- **Errores comunes**: 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 400 `VALIDATION_ERROR`, 404 `MENTOR_NOT_FOUND`. Los cuerpos son estrictos: campos no declarados producen 400.
- **Referencias**: `apps/api/docs/endpoints/epic6/HUXX.md` (contrato detallado), `apps/api/src/modules/mentorship/README.md` (convenciones del módulo), `packages/shared-types/src/mentor.ts` (tipos compartidos).
