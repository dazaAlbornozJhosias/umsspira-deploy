# Auth: credenciales y sesiones propias

Este módulo verifica contraseñas y administra sesiones del API. No delega en un proveedor externo. `user` proporciona identidad y políticas actuales mediante `UserReader`; el JWT no contiene el rol ni los permisos y no se utiliza como copia de esas políticas.

## Contraseñas

Argon2id utiliza una sal independiente por hash, 64 MiB de memoria, tres iteraciones y paralelismo uno. Las cuentas inexistentes recorren una verificación de coste equivalente. Los errores de login no distinguen entre correo inexistente, contraseña incorrecta, cuenta pendiente o cuenta bloqueada. No se registran contraseñas ni tokens.

Los hashes de parámetros anteriores se actualizan después de verificar la contraseña. No existe compatibilidad con contraseñas en claro ni con hashes heredados de otro backend: este sistema parte de credenciales nuevas. El alta de una contraseña exige entre 15 y 128 caracteres, admite frases y no recorta espacios. No se ofrece un registro HTTP que permita asignarse un rol.

## Access y refresh

El access token es un JWT HS256, dura por defecto 15 minutos y valida algoritmo, tipo, emisor, audiencia, expiración y formato de claims. Lleva usuario, sesión y versión de credenciales. La firma protege su integridad; la sesión en PostgreSQL permite revocarlo inmediatamente.

El refresh token combina el identificador de sesión y 256 bits aleatorios. Solo su hash SHA-256 se guarda: este hash rápido es adecuado para un secreto aleatorio de alta entropía, pero no para contraseñas humanas. Cada renovación consume el token y crea otro. Los hashes consumidos permanecen hasta que vence la familia; permiten reconocer una reutilización y revocar la sesión entera.

La rotación bloquea la fila de sesión dentro de una transacción PostgreSQL. Si se detecta reutilización, la revocación se confirma antes de lanzar el error HTTP. Lanzar dentro de la transacción desharía esa revocación. El navegador serializa las renovaciones en una pestaña y, donde está disponible Web Locks, también entre pestañas. Una respuesta de renovación perdida puede requerir volver a iniciar sesión: el servidor no conserva secretos reutilizables para recuperar una rotación consumida.

El cierre de una sesión, el cierre global y el cambio de contraseña revocan persistencia. El cambio de contraseña incrementa su versión y revoca las sesiones en una sola transacción. Un login concurrente se serializa con la actualización de credenciales.

## Navegador y servidor

Next actúa como proxy del mismo origen para `auth` y `user`. Esto evita depender de cookies de terceros entre los dominios del frontend y el API. Access y refresh se transportan en cookies HttpOnly, host-only y SameSite=Lax; en producción son Secure. El access recibido por JavaScript vive únicamente en memoria. El token CSRF es legible por el cliente y su hash está vinculado a la sesión.

La consulta de sesión utilizada por el middleware de Next no rota tokens. El middleware consulta al backend, no confía en cookies de rol. Un fallo de infraestructura produce 503 y conserva la sesión; un 401 indica que hay que autenticarse otra vez.

Las sesiones duran un máximo de 12 horas o 30 días si se eligió recordar, configurables en el entorno. Renovarlas no extiende ese vencimiento absoluto. Las cookies sin recordar terminan con la sesión del navegador. El navegador puede restaurar sesiones al reabrir ventanas; por eso también existe el límite del servidor.

Los límites de login, renovación y cambio de contraseña dependen del puerto `RateLimiter`. En desarrollo/test se utiliza memoria local por defecto; se puede elegir Redis con `AUTH_RATE_LIMIT_STORE=redis` y `REDIS_URL`. Con `NODE_ENV=production` se selecciona Redis por defecto; una demostración de una instancia puede elegir memoria explícitamente. Los contadores de Redis son atómicos y se comparten entre procesos. Una caída en modo Redis devuelve 503 para esas operaciones; no cambia de adaptador silenciosamente. El backend utiliza la IP de la conexión y no confía automáticamente en `X-Forwarded-For`; detrás de un proxy varios usuarios pueden compartir ese límite. Redis elimina los contadores al vencer; las familias de sesión vencidas se eliminan mediante una operación de mantenimiento explícita.

## Fuentes de las decisiones

- [OWASP: almacenamiento de contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- [OWASP: sesiones y cookies](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- [RFC 9700: rotación y detección de reutilización](https://www.rfc-editor.org/rfc/rfc9700.html).
- [RFC 8725: validación de JWT](https://www.rfc-editor.org/rfc/rfc8725.html).

Se implementan los flujos de credenciales y sesión de este módulo. No hay recuperación por correo, MFA, OAuth ni administración HTTP de usuarios o roles: requieren contratos y flujos propios antes de incorporarse.
