# HTTP

controllers contiene un controlador por operación. schemas/registrations.schemas.ts reúne los schemas Zod de todos los endpoints del módulo. presenters convierte resultados de aplicación al contrato de respuesta cuando sus nombres o estructura difieren.

La API usa decoradores de Nest para rutas y guards. RequirePermissions declara la operación requerida; CurrentActor obtiene la identidad ya verificada. PublicRegistration combina rutas públicas de este flujo con origen permitido y límites de tráfico.

Los controladores no acceden a Prisma ni generan códigos. La descarga es una respuesta binaria protegida; las demás respuestas usan el sobre data. Los errores se traducen mediante el filtro compartido.
