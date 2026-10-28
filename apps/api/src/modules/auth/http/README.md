# Adaptación HTTP

`controllers/` tiene un controlador por operación, nombrado por lo que hace: `login.controller.ts`, `refresh-session.controller.ts`, etc. La ruta se declara con los decoradores de Nest en ese archivo; no se añade un router paralelo de Express.

`schemas/` valida y normaliza cada entrada con Zod antes de ejecutar la operación. `presenters/` selecciona los campos públicos de las respuestas. `cookies/` administra los atributos y el ciclo de las cookies del navegador.

El controlador obtiene datos HTTP, llama al caso de uso y adapta el resultado. Las decisiones sobre contraseñas, sesiones o propiedad no pertenecen a este archivo. Una respuesta se construye explícitamente: nunca se serializa directamente un registro de Prisma.

Las rutas siguen `/api/v1/<modulo>/...`. Los roles y permisos se verifican mediante guards y contexto autenticado; no forman parte del nombre de la ruta.
