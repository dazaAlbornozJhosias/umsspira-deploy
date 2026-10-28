# HTTP

controllers contiene un archivo por operación, schemas concentra los esquemas Zod del módulo y presenters selecciona los campos públicos. Los decoradores Controller, Get, Post, Patch o Delete registran las rutas en Nest; el prefijo /api/v1 se aplica globalmente.

RequirePermissions usa el guard compartido y CurrentActor obtiene la identidad verificada. No crear autenticación por headers de usuario o rol. Solo el listado público de mentores lleva Public.

El controlador valida, llama al caso de uso y presenta la respuesta. No consulta Prisma ni decide transacciones. Los errores de negocio se traducen mediante el filtro HTTP central.
