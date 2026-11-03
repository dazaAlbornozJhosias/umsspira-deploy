# Perfil profesional

El módulo organiza formación, experiencia, certificaciones, respaldo y exportación JSON del titulado. Migra las operaciones que ya existían; no agrega NLP, recomendaciones ni otro formato de exportación.

## Cómo se conecta

Nest registra cada ruta con los decoradores del controlador y la lista de controllers en profile.module.ts. No hay un router Express adicional. Cada controlador representa una operación y delega en un caso de uso; los schemas Zod permanecen juntos en http/schemas/profile.schemas.ts.

El actor proviene de los guards compartidos. El caso de uso deriva el perfil de scopes.graduateId; el repositorio también comprueba su relación con actor.id. Tener un permiso no permite elegir un propietario por body, query o cabeceras.

## Reglas y transacciones

Las escrituras bloquean la fila del titulado antes de cambiar sus registros. Esto permite comprobar duplicados académicos y persistir sin que dos peticiones creen la misma formación. El criterio es institución + título + año, ignorando mayúsculas y espacios exteriores.

Eliminar una certificación elimina su respaldo y sus bytes en la misma transacción. Reemplazar el JPG conserva un único respaldo vigente. Los archivos son privados, hasta 5 MiB, y se almacenan en PostgreSQL; el resumen selecciona metadatos, no sus bytes.

El modelo de dominio usa campos explícitos y no importa Prisma. translator convierte filas a esos modelos; presenter adapta sus nombres al contrato HTTP y construye la descarga JSON. Las credenciales y sesiones pertenecen a auth/user y no se incluyen en el perfil.

El frontend todavía tiene datos y operaciones simulados. Los [contratos HTTP](../../../docs/endpoints/epic02-grupo02-hu1.2.md) describen qué debe consumir al integrarse.

## Reintentos de creacion de certificaciones

POST /api/v1/perfil/certificaciones admite idOperacion opcional (UUID). El frontend lo genera antes del primer envio y lo reutiliza mientras reintenta ese registro. Con el mismo titulado, UUID y contenido normalizado, la API devuelve 201 con el mismo registro, incluso si ya se agrego su JPG o se edito despues; no sobrescribe esa edicion. Otro contenido para la misma operacion devuelve 409. Si se elimino el registro devuelve 410 en vez de recrearlo. Otro titulado tiene un espacio de claves separado.

El registro interno certificacion_creacion y la certificacion se guardan en la misma transaccion, bajo el bloqueo del titulado. El registro de operacion se conserva al borrar la certificacion y se elimina al borrar el titulado. Su tabla tiene RLS y no permite acceso directo de anon/authenticated. No se almacenan los textos ni el JPG en ese registro, solo el hash, identificadores y fecha.

Los clientes sin idOperacion conservan el contrato anterior; esa via no ofrece deduplicacion de reintentos. Un alta nueva intencional recibe otro UUID y puede tener los mismos textos. La clave del formulario vive durante ese intento montado; no se promete recuperar un formulario ni su archivo al recargar el navegador.

Despliegue: aplicar primero 20261103191016_certificacion_creacion_idempotente, despues API nueva y despues frontend nuevo. No enviar idOperacion a la API antigua, que valida estrictamente el cuerpo. La migracion es aditiva; una vuelta al codigo anterior no requiere borrar la tabla, aunque deja de ofrecer esta garantia. No ejecutar un DROP automatico como rollback.

Prueba opt-in: test/certification-idempotency.integration.spec.ts usa TEST_DATABASE_URL solo como servidor PostgreSQL local, crea su propia BD temporal, aplica migraciones y la borra al terminar. Comprueba host/puerto/nombre efectivos antes de inicializar la aplicacion; nunca apuntar esa variable a Supabase. Ejecutar con jest.integration.config.cjs y --runInBand --runTestsByPath test/certification-idempotency.integration.spec.ts.
