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
