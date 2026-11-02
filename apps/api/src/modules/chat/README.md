# Chat profesional

El chat permite iniciar contacto entre todos los roles con cuenta activa. El primer mensaje crea una solicitud pendiente. Solo el destinatario puede aceptarla o rechazarla. Hasta aceptarla ninguno puede enviar mensajes adicionales ni adjuntos. Rechazar conserva el historial y cierra los envíos; el destinatario puede aceptar posteriormente. La pareja mantiene una sola conversación, incluso al iniciar solicitudes simultáneas. No existen respuestas simuladas.

## Arquitectura

- Dominio: estados, pertenencia, autoría, contenido y validación de adjuntos, sin Nest ni Prisma.
- Aplicación: un caso de uso por operación. ChatRepository, ChatEvents y el directorio público de user son los puertos.
- HTTP: autenticación y permisos compartidos, Zod estricto, límite de frecuencia y presenters explícitos.
- Infraestructura: repositorio transaccional con PrismaService compartido y gateway Socket.IO como adaptador de ChatEvents.
- El módulo user publica UserDirectory con datos mínimos; chat no decide qué cuentas pueden iniciar sesión.

Las escrituras se hacen por HTTP y se autentican en cada petición. Socket.IO distribuye únicamente invalidaciones a salas por usuario, nunca el contenido de un mensaje. El cliente vuelve a consultar datos autorizados. Una caída al publicar no cambia el resultado de una escritura confirmada. El frontend sincroniza al reconectar, recuperar foco y periódicamente; recupera páginas intermedias si se perdió más de una página durante un corte. No requiere Redis para una instancia; con varias réplicas la actualización inmediata necesita un adaptador de difusión compartido. La consulta periódica mantiene la convergencia.

## Contrato HTTP

Todas las rutas parten de /api/v1/chat. Requieren sesión activa y el permiso universal existente user:self:read. Las operaciones de conversaciones verifican además pertenencia; ser administrador no concede lectura de chats ajenos. Los UUID, cuerpos y consultas se validan con Zod. Respuestas JSON: { data: ... }; errores: { error: { code, message, fields? } }.

| Método | Ruta | Entrada | Resultado |
| --- | --- | --- | --- |
| GET | /contacts | q opcional (hasta 100 caracteres), page desde 1 | items con id/name/role y hasMore; 20 por página |
| POST | /conversations | recipientId, content, clientId | conversation y created; crea la solicitud y su primer mensaje atómicamente |
| GET | /conversations | page desde 1 | items y hasMore; 20 por página |
| GET | /conversations/:id | UUID | resumen de una conversación propia |
| GET | /conversations/:id/messages | before opcional (UUID de mensaje de ese chat) | items cronológicos y nextCursor; 30 por página |
| POST | /conversations/:id/messages | content, clientId | mensaje guardado |
| PATCH | /conversations/:id/request | decision: accept o decline | nuevo estado; solo destinatario |
| PUT | /conversations/:id/read-receipt | messageId mostrado en ese chat | read: true; el marcador nunca retrocede |
| PATCH | /conversations/:id/messages/:messageId | content | mensaje editado; solo autor y chat aceptado |
| DELETE | /conversations/:id/messages/:messageId | sin body | tombstone sin texto ni archivo; solo autor |
| POST | /conversations/:id/attachments | multipart: file, clientId, content opcional | mensaje con metadatos del archivo; solo chat aceptado |
| GET | /conversations/:id/messages/:messageId/attachment | UUID de mensaje | descarga privada con nombre original |
| GET | /unread-summary | sin query | total y hasta 5 conversaciones con mensajes sin leer |

Content tiene entre 1 y 500 caracteres tras trim; un adjunto puede tener texto vacío. ClientId es un UUID generado al iniciar un envío y conservado al reintentar: la unicidad por emisor impide duplicados. Reutilizarlo para otra operación produce conflicto. Si se inicia contacto con una pareja existente, se devuelve esa conversación con created: false y no se envía el borrador; el frontend lo informa.

Los adjuntos admiten PDF, JPG/JPEG, PNG y formatos modernos DOCX/XLSX/PPTX, hasta 10 MB. Se verifica firma, extensión y estructura del contenedor Office; no se admiten macros. Los bytes se almacenan en PostgreSQL, no en disco efímero ni en un bucket público. Eliminar el mensaje retira también sus bytes. Las listas y eventos no cargan ni exponen bytes.

Se permiten 10 intentos de nuevo contacto y 60 mutaciones por minuto por usuario usando el RateLimiter compartido. Una sesión ausente devuelve 401, una conversación ajena 404, autoría/destinatario incorrecto 403, un estado incompatible 409 y el límite de frecuencia 429. Los errores de validación son 400 y un archivo demasiado grande es 413.

## Tiempo real y frontend

Namespace /chat, transport path estándar /socket.io. Handshake auth: { token: accessToken }. El gateway verifica el token antes de aceptar la conexión y valida Origin contra CORS_ORIGINS. Cada 30 segundos vuelve a validar sesión y cierra suscripciones expiradas/revocadas. El cliente obtiene y renueva el token a través del flujo auth existente; no lee cookies HttpOnly ni persiste tokens adicionales.

Eventos servidor: chat:ready, chat:changed { conversationId }, chat:session_expired. No hay comandos de envío por socket. La sesión y las suscripciones se limpian al cerrar sesión.

La página /portal/mensajes usa las bandejas Chats, Solicitudes y Rechazadas; integra búsqueda, presentación del primer mensaje, decisiones, historial, edición, eliminación, adjuntos y lectura. Los enlaces con ?conversation= abren una conversación y ?recipient= preparan un primer contacto. La barra superior consume /unread-summary. El HTTP JSON usa el proxy del frontend; los archivos y el socket conectan directamente con la API usando Bearer/handshake auth para evitar límites de tamaño del proxy.

## Verificación

Pruebas normales del backend: pnpm --filter api test -- --testPathPattern=chat.
Las pruebas de PostgreSQL son opt-in y rechazan cualquier destino distinto de 127.0.0.1:55439/umsspira_chat_test. Preparar una base desechable con ese nombre y asignar CHAT_TEST_DATABASE_URL. Ejecutar Jest con --testPathPattern=prisma-chat.repository.integration --testPathIgnorePatterns=node_modules. La prueba crea un esquema mínimo anterior, aplica el SQL real y verifica conservación, concurrencia, idempotencia, privacidad, adjuntos, no leídos y paginación. No ejecutar este fixture sobre datos útiles.

