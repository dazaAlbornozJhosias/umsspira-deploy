# Directorio y perfil de mentores

Migra participación, información profesional, áreas, intereses, disponibilidad y desactivación administrativa. `POST /api/v1/mentorship/requests` crea solicitudes pendientes y valida que el titulado, el mentor y el horario cumplan las reglas. `GET /api/v1/mentorship/requests` lista solicitudes recibidas del mentor autenticado (página máxima de 20); `GET /api/v1/mentorship/requests/:id` consulta el detalle. `PATCH /api/v1/mentorship/requests/:id/accept` y `PATCH /api/v1/mentorship/requests/:id/reject` responden solicitudes pendientes. La aceptación crea una conexión en la misma transacción y las respuestas encolan correo usando el worker SMTP existente. No requieren cambios de tablas ni migraciones.

## Rutas y acceso

Nest registra las rutas en los decoradores de cada controlador y conecta las clases en mentorship.module.ts. Cada archivo representa una operación; los schemas Zod comparten http/schemas/mentorship.schemas.ts. No se necesita un router de Express.

Los guards globales verifican sesión y RequirePermissions. La identidad propia se obtiene del actor; ningún body ni header puede escoger otro usuario. La desactivación administrativa comprueba las carreras asignadas al actor.

## Identidad y concurrencia

Usuario, titulado y mentor tienen UUID independientes. mentor.id_titulado enlaza un único perfil con su titulado. No comparar estos identificadores entre sí ni reutilizar actor.id como ID del mentor.

Las escrituras bloquean el titulado dentro de una transacción. Esto serializa cambios de participación, información, intereses, áreas y disponibilidad del mismo perfil; evita crear perfiles duplicados o agregar un interés después de quitar su área.

La información profesional usa columnas explícitas. La migración convierte el JSON histórico de experiencia; un mentor histórico sin titulado asociado detiene la migración para exigir una asociación válida.

## Disponibilidad

El directorio de la HU-6.7 muestra únicamente mentores cuyo último estado es AVAILABLE. PAUSED, UNAVAILABLE y la ausencia de disponibilidad los excluyen. Consultar no crea registros. La política `canReceiveMentorship` sigue determinando quién puede recibir solicitudes en otros flujos. El perfil detallado de la HU-6.9 muestra mentores activos AVAILABLE, PAUSED o sin estado (estos dos sin poder solicitar) y responde 404 si el último estado es UNAVAILABLE.
DISPONIBLE acepta solicitudes, EN_PAUSA conserva la visibilidad sin aceptarlas y NO_DISPONIBLE oculta el perfil del directorio. Sin estado registrado también permanece visible, pero no recibe solicitudes. Consultar no crea registros.

El módulo exporta MENTOR_AVAILABILITY_REPOSITORY mediante un port. Otros módulos pueden consultar canReceiveRequests sin importar Prisma ni consultar directamente estas tablas.

## Filtros del directorio

`GET /api/v1/mentorship/filter-options?areaIds=<uuid>&areaIds=<uuid>` requiere sesión de titulado y devuelve el catálogo de áreas activas junto con los intereses activos de las áreas seleccionadas. Sin áreas, `intereses` es una lista vacía.

`GET /api/v1/mentorship/profiles/filter?areaIds=<uuid>&interestIds=<uuid>` también requiere sesión de titulado. Los filtros aceptan UUID repetidos o separados por comas; dentro de cada grupo se aplica OR y, al combinar áreas e intereses, ambos criterios deben coincidir. Los intereses enviados junto con áreas deben pertenecer a alguna de ellas. IDs inexistentes, inactivos o incompatibles responden 400. Si no hay coincidencias, se responde 200 con `data: []`.

Los filtros solo leen el catálogo `area` y las relaciones `mentor_area`; no crean catálogos ni modifican perfiles. El directorio filtrado conserva la visibilidad habitual: solo titulados y mentores activos cuyo estado no sea `UNAVAILABLE`.

Los [contratos HTTP](../../../docs/endpoints/epic06-grupo06-hu1.6.md) documentan las rutas nuevas. La integración del frontend queda pendiente.
