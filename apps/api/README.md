# Backend de UMSSPIRA

NestJS organiza el servidor y sus dependencias. Prisma consulta PostgreSQL. El proyecto alojado en Supabase se utiliza exclusivamente como base de datos: no intervienen sus servicios de autenticación, sesiones o autorización.

## Organización

`src/modules` reúne capacidades del negocio. Dentro de cada módulo, `domain` expresa reglas; `application` coordina operaciones y define puertos; `infrastructure` implementa esos puertos; `http` adapta las peticiones y respuestas. El archivo `*.module.ts` conecta las piezas con Nest.

Esta dirección de dependencias permite probar una regla sin arrancar HTTP ni disponer de PostgreSQL. También permite reemplazar una implementación sin cambiar al consumidor del puerto. Separar carpetas solo es útil cuando se conserva esa dirección: un caso de uso no debe importar Prisma, Express ni un controlador.

`src/shared` contiene contratos y mecanismos que realmente comparten varios módulos. Un estado o una regla específica de mentorías pertenece a mentorías, aunque otros equipos la consuman mediante un contrato público.

- [Fronteras entre módulos](src/modules/README.md)
- [Datos de demostración por épica](scripts/seed/README.md)
- [Contexto y seguridad compartidos](src/shared/README.md)
- [Autenticación y sesiones](src/modules/auth/README.md)
- [Identidad y permisos](src/modules/user/README.md)
- [Esquema y migraciones](prisma/README.md)
- [Contratos HTTP de autenticación](docs/endpoints/epic01-grupoXX-huXXX.md)
- [Registro y backoffice documental, épica 1](docs/endpoints/epic01-grupo01-hu1.1.md)
- [Perfil profesional, épica 2](docs/endpoints/epic02-grupo02-hu1.2.md)
- [Eventos universitarios, épica 7](docs/endpoints/epic07-grupo07-hu1.7.md)
- [Archivos históricos y dependencias del frontend](docs/archivos-del-backend-anterior.md)
- [Perfil corporativo, épica 4](docs/endpoints/epic04-grupo04-hu1.4.md)
- [Publicación de vacantes, épica 5](docs/endpoints/epic05-grupo05-hu1.5.md)
- [Población, cuentas y permisos de demostración](scripts/README.md)
- [Alcance de las pruebas](test/README.md)

## Ejecución

Usar Node 22.12 o superior. Desde la raíz, `pnpm install` instala los workspaces. Completar `apps/api/.env` a partir de `.env.example`. La clave `AUTH_JWT_SECRET` es independiente de la contraseña de PostgreSQL: se genera con un generador criptográfico, tiene al menos 64 caracteres y nunca se versiona.

`pnpm --filter api dev` inicia el servidor; `build` genera Prisma y compila; `test` ejecuta las pruebas; `lint` y `typecheck` verifican código y tipos. `/health` sigue siendo público. Las rutas del sistema usan `/api/v1/<modulo>/...`.

`db:deploy` aplica las migraciones aprobadas al destino configurado en `DIRECT_URL`. `db:migrate` genera migraciones en desarrollo y requiere una base auxiliar independiente. Ninguno de esos comandos se ejecuta al arrancar el servidor. Los scripts que modifican datos son operaciones explícitas, explicadas en [scripts](scripts/README.md).

La documentación de endpoints sigue la plantilla institucional de docs/endpoints. Los README describen responsabilidades y decisiones para que una persona o una IA pueda interpretar el código antes de modificarlo.

## Formato y estructura

`pnpm --filter api format` aplica el formato; `format:check` lo comprueba. Los tipos y funciones se escriben con una declaración por línea, sangría consistente y bloques con llaves. El código generado de Prisma se excluye del formato.

Los límites usan memoria por defecto en desarrollo/test: Redis no necesita estar iniciado para trabajar localmente. `AUTH_RATE_LIMIT_STORE=redis` selecciona el adaptador compartido y exige `REDIS_URL` explícita. Con `NODE_ENV=production` se selecciona Redis por defecto. La plantilla gratuita de Render elige memoria explícitamente para una demostración con una instancia; al desplegar varias instancias se debe seleccionar Redis y configurar su URL. Para probar Redis localmente se puede iniciar únicamente ese servicio con `docker compose up -d redis`. PostgreSQL sigue siendo la fuente de identidad y sesiones.

El adaptador se elige al arrancar. No existe una sustitución automática por memoria si Redis falla: en modo Redis se conserva el error 503. Los contadores locales vencen con la misma política, pero se reinician con el proceso y no se comparten entre instancias.

## Configuración de entorno

`.env.example` contiene las mismas siete variables de la configuración local, con las conexiones y la clave vacías. Para comenzar, copia el archivo y completa `DATABASE_URL`, `DIRECT_URL` y `AUTH_JWT_SECRET`. Sus comentarios explican cada valor; los nombres de rama no intervienen.

| Variable | Qué representa | Valor habitual en el equipo |
| --- | --- | --- |
| `NODE_ENV` | Modo de ejecución de Node | `development` en la PC; `production` al publicar; `test` lo configuran las pruebas |
| `APP_ENV` | Destino de los datos y autorización del seed de demostración | `epic` para la base del equipo; `dev` para integración; `production` para el sistema simulado real; `test` para pruebas |
| `PORT` | Puerto del backend | `3000` |
| `CORS_ORIGINS` | Orígenes web permitidos | `http://localhost:3001`; al publicar, la URL pública del frontend |
| `DATABASE_URL` | Conexión de la API a PostgreSQL | Pooler de transacciones del proyecto Supabase, puerto `6543` |
| `DIRECT_URL` | Conexión de migraciones y scripts | Pooler de sesiones del mismo proyecto, puerto `5432` |
| `AUTH_JWT_SECRET` | Clave de firma de los tokens propios | Se genera una vez por entorno con el comando del ejemplo |

`NODE_ENV` y `APP_ENV` son independientes. Por ejemplo, el servidor compartido puede ejecutar `NODE_ENV=production` y usar `APP_ENV=dev`, porque ejecuta el modo publicado de Node sobre datos ficticios de integración.

Al publicar con `NODE_ENV=production`, las cookies utilizan HTTPS y el limitador elige Redis por defecto. La plantilla gratuita de Render ya selecciona `AUTH_RATE_LIMIT_STORE=memory` explícitamente para su demostración de una sola instancia.

### Ajustes opcionales

Estos ajustes ya tienen valores por defecto o solo se usan en operaciones concretas. No es necesario copiarlos al `.env` para trabajar localmente. Si se necesita cambiarlos, se agrega únicamente la variable correspondiente.

| Variable opcional | Valor por defecto o condición | Cuándo cambiarla |
| --- | --- | --- |
| `AUTH_RATE_LIMIT_STORE` | `memory` en desarrollo/test; `redis` en producción | Para elegir explícitamente el adaptador de límites |
| `REDIS_URL` | Se exige una URL explícita cuando se selecciona Redis | Al habilitar Redis; para el servicio Docker local: `redis://localhost:6379` |
| `SHADOW_DATABASE_URL` | Sin valor | Solo al generar migraciones con una base auxiliar desechable; no hace falta para aplicar migraciones existentes |
| `AUTH_JWT_ISSUER` | `umsspira-api` | Si se cambia el emisor que validan los access tokens |
| `AUTH_JWT_AUDIENCE` | `umsspira-web` | Si se cambia el destinatario que validan los access tokens |
| `AUTH_ACCESS_SECONDS` | `900` segundos, 15 minutos | Para ajustar la duración del access token |
| `AUTH_SESSION_HOURS` | `12` horas | Para ajustar el vencimiento de una sesión sin recordar |
| `AUTH_REMEMBER_DAYS` | `30` días | Para ajustar el vencimiento al elegir recordar |
| `AUTH_COOKIE_SECURE` | Activado con `NODE_ENV=production` | Para probar cookies HTTPS localmente; no admite desactivarlas en modo producción |
| `SMTP_URL` | `smtp://127.0.0.1:1025` | Servidor SMTP de correo real al publicar; en desarrollo lo recibe Mailpit |
| `MAIL_FROM` | `UMSSPIRA <no-reply@umsspira.local>` | Remitente autorizado por el servidor SMTP al publicar |

No se guardan credenciales reales en `.env.example`. El `.env` local permanece ignorado por Git.

## Probar el registro documental

Iniciar el backend y ejecutar `docker compose up -d mailpit` desde la raíz. Leer los correos de prueba en http://localhost:8025. Registrar el borrador, pedir el código por `/api/v1/email-verification/resend`, verificarlo, adjuntar el documento y enviar. Iniciar sesión como administrador para revisar la solicitud; al aprobar se recibe otro código para establecer una contraseña y activar la cuenta. El recorrido y cada contrato están en la documentación de la épica 1. Mailpit no entrega a direcciones reales de Internet; permite verificar el flujo local sin credenciales SMTP adicionales.

El backend guarda los respaldos de hasta 5 MiB en PostgreSQL y controla su lectura. La cola de notificaciones y los borradores sobreviven a reinicios sin requerir Redis. Las migraciones se aplican con el comando habitual `pnpm --filter api db:deploy`; el seed de roles y cuentas sigue siendo `pnpm --filter api db:seed:demo`.
