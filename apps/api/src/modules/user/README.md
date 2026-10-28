# User: identidad y acceso vigentes

`Usuario` identifica a la persona o cuenta institucional; `CuentaAcceso`, gestionada por auth, guarda su hash y versión de credenciales. Sus identificadores se generan en este backend. Ningún identificador de otro proveedor ni `user_metadata` interviene en la autorización.

El usuario tiene un estado explícito: PENDIENTE, ACTIVO, BLOQUEADO o ELIMINADO. Solo ACTIVO puede autenticarse. El rol existente en `usuario.rol` debe pertenecer al catálogo y estar habilitado. Los permisos habilitados se consultan desde PostgreSQL en cada petición, por lo que bloquear un usuario o deshabilitar una política no espera al vencimiento del JWT.

`UserReader` es el contrato público para obtener un actor autorizado. Su adaptador consulta únicamente los campos necesarios y el translator construye el contexto. El presenter excluye versiones de credenciales, hashes y detalles de persistencia.

Los identificadores de usuario, empresa y titulado son diferentes. `scopes.companyIds` se resuelve mediante `empresa.id_usuario`; `graduateId`, mediante `titulado.id_usuario`; `careerIds`, mediante asignaciones administrativas activas. Una asignación sin estado ACTIVO no amplía acceso. El rol administrador no supone acceso universal a todas las carreras.

El catálogo inicial refleja operaciones existentes: revisión de solicitudes, perfil propio, empresa propia, creación de vacantes, mentorías, eventos y reportes. Un permiso describe una operación; no implementa el módulo ni su endpoint. Los guards verifican permisos y los casos de uso verifican propiedad o carrera sobre el registro real.

El módulo solo expone la consulta propia. Las asignaciones de roles y los estados no se aceptan desde el login ni desde la consulta de perfil. La creación inicial se realiza mediante una operación de servidor explícita; los flujos posteriores de registro podrán consumir un contrato de alta cuando se migren.
