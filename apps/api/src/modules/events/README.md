# Eventos universitarios

El módulo migra catálogo público, detalle publicado, creación, consulta propia, edición/publicación de borradores, portadas e inscripciones confirmadas. La cancelación, asistencia y emisión de pases QR pertenecen a historias posteriores.

## Rutas y permisos

Nest registra rutas mediante decoradores, con un controlador por operación. catalog describe la lectura pública, owned la gestión propia y drafts las operaciones que exigen BORRADOR. Estos nombres expresan el recurso y su estado; el rol no aparece en la URL.

RequirePermissions utiliza el permiso eventos:manage del actor verificado. El repositorio comprueba id_usuario al gestionar un evento; conocer el UUID no permite editar un borrador ajeno. La publicación bloquea la fila y vuelve a comprobar el estado.

La inscripción requiere un actor con rol titulado. El repositorio bloquea la fila del evento, vuelve a comprobar publicación, vigencia, cupo y duplicado confirmado antes de insertar. La ocupación se deriva de las inscripciones CONFIRMADA, no se guarda en evento. Un índice único parcial impide dos confirmaciones para el mismo usuario y evento, sin afectar registros CANCELADA históricos.

## Archivos

La portada se carga antes de crear el evento, por eso existe como recurso independiente. Su referencia se valida como una ruta de esta API y se comprueba su propietario dentro de la transacción. Una FK relaciona el archivo con un único evento; imagen_url es una columna histórica y no se utiliza para autorizar o localizar los bytes nuevos.

Las portadas publicadas son públicas; una carga temporal o de borrador solo se entrega al creador autenticado con permiso. La lectura utiliza autenticación opcional para permitir ambos casos y conserva el control de acceso en persistencia. Una credencial vencida se trata como visitante en esa lectura: no obtiene acceso privado. Los errores de infraestructura se propagan.

Los formatos admitidos son JPG, PNG y WebP de máximo 5 MiB con firma y extensión coherentes. Los bytes se guardan en PostgreSQL para no depender de Supabase Storage ni del disco efímero de un despliegue. Al cancelar una carga sin utilizar, el cliente puede eliminarla con DELETE covers/:id. Una portada vinculada no se elimina por esa operación.

HU3 no crea pases QR. HU10 debe asociar un pase QR único a una inscripción confirmada mediante su propio contrato; esa integración no está disponible todavía.

## Integración

Los [contratos HTTP](../../../docs/endpoints/epic07-grupo07-hu1.7.md) contienen la equivalencia con las rutas antiguas. El frontend todavía utiliza varias URLs con /admin y respuestas sin sobre data; se conserva sin modificaciones en esta migración.
