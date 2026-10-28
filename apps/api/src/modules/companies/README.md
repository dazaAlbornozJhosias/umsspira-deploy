# Perfil corporativo

Este módulo adapta las tres operaciones existentes de consulta y edición de perfil. Su contrato está en [endpoints](../../../docs/endpoints/epic04-grupo04-hu1.4.md). No representa todavía el flujo completo de alta y administración de empresas.

La estructura sigue el mismo reparto que vacantes: `domain/entities`, `domain/policies` y `domain/errors`; `application/contracts`, `application/ports` y `application/use-cases`; `http/controllers`, `http/presenters` y `http/schemas`; `infrastructure/providers`, `infrastructure/repositories` y `infrastructure/translators`.

Cada operación tiene su propio controlador y caso de uso. Todos los schemas HTTP del módulo se reúnen en `companies.schemas.ts`. Los presenters eligen la respuesta pública y los translators convierten nombres de columnas a conceptos internos. El módulo de Nest conecta las piezas; no contiene reglas de negocio.

Los guards globales verifican la sesión y el permiso declarado junto a la ruta. El caso de uso comprueba el scope de empresa. El repositorio vuelve a filtrar por el propietario real; nunca interpreta un header de usuario como identidad.

El encabezado utiliza una selección pequeña. El contacto elige explícitamente teléfono principal y dirección visible. La modificación de empresa y contacto se realiza en una transacción, para que un fallo no deje un perfil parcialmente actualizado. NIT/RUC y la credencial de login no se modifican.

No se importan servicios de auth ni adaptadores de otros módulos. La identidad llega mediante el contexto autenticado compartido; la persistencia se consume mediante un puerto.
