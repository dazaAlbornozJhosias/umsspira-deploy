# Contratos y mecanismos compartidos

`security/actor-context.ts` describe al actor que la aplicación ya autenticó: usuario, rol, permisos vigentes y relaciones con empresas, titulado y carreras. La versión de credenciales sirve para invalidar sesiones anteriores a un cambio de contraseña; no forma parte del presenter público.

En `http/auth`, el guard global protege por defecto todos los controladores. `@Public()` identifica excepciones explícitas, como login y salud. `@RequirePermissions(...)` exige todos los permisos indicados; `@Roles(...)` restringe roles cuando el contrato realmente lo necesita. `@CurrentActor()` entrega el contexto verificado al controlador.

Una autorización tiene dos partes: permiso para una operación y alcance sobre el recurso concreto. El guard comprueba la primera. El caso de uso comprueba la segunda después de resolver a quién pertenece el recurso. Un UUID recibido por URL no demuestra propiedad.

Las peticiones con bearer usan el JWT y una sesión persistida. Las que autentican mediante cookie y modifican estado requieren además `X-CSRF-Token`, cuyo hash está vinculado a la sesión. CORS controla qué orígenes puede leer un navegador; no sustituye la autenticación ni el control CSRF.

`errors` contiene errores de aplicación y validación. `http/filters` los convierte a respuestas consistentes, incluidas las rutas inexistentes. Los errores inesperados no incluyen consultas, contraseñas ni valores del entorno. `infrastructure/database` concentra el cliente Prisma y el pool, compartidos por los adaptadores de persistencia.
