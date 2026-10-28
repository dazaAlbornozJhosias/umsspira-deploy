# Adaptadores y composición

`repositories/` implementa los puertos de credenciales y sesiones con Prisma. `translators/` convierte registros de persistencia en entidades del dominio. `security/` implementa hash de contraseñas, firma de tokens y límites de acceso. `scripts/` contiene el comando Lua que ejecuta Redis de forma atómica.

`providers/` conecta contratos con implementaciones usando factories de Nest. El archivo del módulo reúne estos providers, los controladores y las dependencias compartidas. El caso de uso recibe un puerto; la elección de Prisma, Argon2 o Redis ocurre aquí.

`schemas/` valida formatos externos utilizados por los adaptadores, como la estructura del refresh token. Su identificador de sesión se valida con Zod antes de consultar persistencia. La aplicación consume el puerto de tokens y no necesita conocer cómo se codifica ese identificador.

PostgreSQL conserva cuentas y sesiones revocables. `InMemoryRateLimiter` mantiene contadores temporales locales para desarrollo; `RedisRateLimiter` los comparte entre instancias. La factory selecciona la implementación mediante configuración, sin modificar los casos de uso. Los contadores en memoria se pierden al reiniciar y se limpian al vencer; no son un almacén distribuido. El incremento y la expiración se ejecutan juntos para evitar contadores sin vencimiento. Si Redis falla, se comunica la indisponibilidad y no se omite el límite.

Las transacciones y bloqueos protegen operaciones concurrentes. Los errores que deben persistir una revocación se comunican después del commit; lanzar una excepción dentro de la transacción revertiría también esa revocación.
