# Migración del backend y acuerdos de arquitectura

El backend activo está en `apps/api`. Se reinició su implementación con NestJS, arquitectura hexagonal por módulo, Prisma 7 y validación Zod.

La migración cubre las operaciones HTTP que ya existían y la base de autenticación necesaria para protegerlas. Las rutas duplicadas se unificaron y las utilidades de prueba de mentorías quedaron fuera. La integración del frontend con los contratos nuevos sigue pendiente.

## Tecnologías y responsabilidades

| Herramienta                     | Responsabilidad                                                  |
| ------------------------------- | ---------------------------------------------------------------- |
| NestJS 10                       | Servidor HTTP, controladores, guards e inyección de dependencias |
| Prisma 7 y adaptador PostgreSQL | Acceso a datos, cliente tipado y migraciones                     |
| PostgreSQL alojado en Supabase  | Persistencia de datos                                            |
| Zod 4                           | Validación y transformación de entradas y configuración          |
| Argon2id                        | Hash de contraseñas                                              |
| JWT                             | Access tokens firmados, vinculados a sesiones persistidas        |
| SMTP y Nodemailer               | Entrega de códigos y notificaciones                              |
| pdfmake                         | Exportación PDF institucional                                    |
| Redis, cuando se configura      | Contadores compartidos del limitador de peticiones               |

Supabase solo aloja PostgreSQL. La API no utiliza Supabase Auth, Storage, SDK ni funciones RPC para resolver el negocio. Las consultas del backend pasan por los adaptadores que utilizan Prisma.

El backend requiere Node 22.12 o superior y se gestiona con pnpm desde el monorepo.

## Estructura general

```text
apps/api/
  docs/
    cambios-backend.md
    endpoints/
  prisma/
    schema.prisma
    migrations/
  scripts/
    seed/
    accounts/
  src/
    main.ts
    app.module.ts
    config/
    generated/prisma/       # salida generada, ignorada por Git
    shared/
    modules/
      auth/
      user/
      registrations/
      profile/
      companies/
      job-postings/
      mentorship/
      events/
      reports/
```

`main.ts` arranca el servidor. `app.module.ts` compone los módulos y carga la configuración. La configuración HTTP compartida aplica el prefijo de rutas, CORS, Helmet y el filtro de errores.

`config` valida las variables al iniciar. `scripts` contiene operaciones explícitas de población y mantenimiento; no son endpoints y no se ejecutan automáticamente al arrancar la API.

Los README de módulos y capas explican las responsabilidades para estudiantes y herramientas de asistencia. Antes de extender una capacidad, se debe leer el README del módulo y el contrato de su endpoint.

## Estructura dentro de un módulo

```text
<modulo>/
  <modulo>.module.ts
  domain/
    entities/
    policies/
  application/
    contracts/
    ports/
    services/
    use-cases/
  http/
    controllers/
    schemas/
    presenters/
    guards/
  infrastructure/
    repositories/
    translators/
    providers/
```

Se crean las subcarpetas que tengan una responsabilidad concreta. Un módulo puede necesitar adaptadores adicionales, como `infrastructure/exporters`, `security` o `notifications`. No se colocan archivos sueltos en la raíz de una capa.

| Ubicación                   | Qué contiene y por qué                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| domain/entities             | Tipos del negocio independientes de la BD y del transporte              |
| domain/policies             | Reglas expresadas sin depender de Nest, Express o Prisma                |
| application/contracts       | Entradas y resultados que necesitan los casos de uso                    |
| application/ports           | Interfaces para persistencia y servicios externos                       |
| application/use-cases       | Una operación de aplicación por archivo                                 |
| application/services        | Coordinación reutilizada entre operaciones del módulo                   |
| http/controllers            | Un controlador por operación; recibe la petición y llama al caso de uso |
| http/schemas                | Validación Zod; varios esquemas reunidos en un archivo por módulo       |
| http/presenters             | Construcción explícita de respuestas públicas                           |
| http/guards                 | Controles HTTP específicos del módulo, cuando existen                   |
| infrastructure/repositories | Implementaciones de los puertos de persistencia con Prisma              |
| infrastructure/translators  | Conversión de filas y relaciones a tipos internos                       |
| infrastructure/providers    | Conexión de puertos, adaptadores y casos de uso en Nest                 |

`auth` conserva su distribución específica de seguridad y sesiones. Los demás módulos siguen las subcarpetas estandarizadas.

### Dirección de dependencias

Los casos de uso dependen de interfaces, no de repositorios Prisma concretos. El dominio y la aplicación no importan controladores, Express ni el cliente generado de Prisma.

El archivo `*.module.ts` y sus providers conectan las piezas. Un repositorio implementa un port; el caso de uso consume ese port sin conocer la herramienta que lo implementa.

Entre módulos se utilizan contratos de aplicación. Compartir una base de datos no significa que cualquier módulo deba modificar las tablas de otro. Por ejemplo, auth consulta la identidad mediante un adaptador del contrato de user; mentorías exporta un contrato para consultar disponibilidad.

### Presenter y translator

Se utilizan nombres distintos porque resuelven problemas distintos:

- `translator`, en infraestructura, convierte registros de persistencia a entidades o resultados internos.
- `presenter`, en HTTP, selecciona y transforma los campos que recibe el cliente.

Los modelos generados de Prisma permanecen en infraestructura. No sustituyen a las entidades de dominio ni se devuelven directamente al cliente. Un presenter evita exponer hashes, sesiones o datos privados por serializar una fila completa.

## Rutas, controladores y validación

Las rutas usan `/api/v1/<modulo>/...`. Se conservan los nombres efectivos de cada contrato, como `perfil`, `companies` o `mentorship`. `/health` es la excepción sin prefijo.

En Nest las rutas se declaran con decoradores. No se necesita una carpeta adicional de routers que vuelva a registrar las mismas operaciones:

```ts
@Controller('companies')
export class GetCompanyHeaderController {
  constructor(private readonly useCase: GetCompanyHeaderUseCase) {}

  @Get(':companyId/header')
  @RequirePermissions('empresas:self:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', new ZodValidationPipe(companyIdSchema)) companyId: string,
  ) {
    return { data: await this.useCase.execute(actor, companyId) };
  }
}
```

Con el prefijo global, esa declaración registra `GET /api/v1/companies/:companyId/header`. El controlador se incluye en el módulo de Nest correspondiente y ese módulo se importa en la composición de la API.

El controlador valida las entradas y delega. No realiza consultas Prisma, calcula permisos a partir de headers ni concentra varias operaciones en un solo archivo. Los nombres de archivos describen su operación.

Zod valida body, parámetros y query según el contrato. Los schemas nuevos se reúnen en un archivo por módulo: pueden existir varias constantes y esquemas en ese archivo. No se utiliza class-validator ni class-transformer para estas entradas.

Las interfaces y funciones se escriben con campos y sentencias en líneas separadas, sangría consistente y bloques con llaves. Prettier aplica el formato; ESLint verifica las convenciones.

### Respuestas y errores

El éxito normalmente utiliza `{ "data": ... }`. Los campos de paginación se documentan por endpoint: algunos contratos usan `limit` y otros `pageSize`. Los archivos devuelven bytes, las operaciones 204 no tienen cuerpo y `/health` devuelve su estado directamente.

Los errores utilizan una estructura compartida:

```json
{
  "error": {
    "code": "CODIGO",
    "message": "Descripción del problema"
  }
}
```

La validación puede agregar información de campos. El filtro HTTP central traduce errores de aplicación, Zod, Prisma y rutas inexistentes. Los errores inesperados se registran sin devolver detalles internos al cliente.

En Nest, los handlers asíncronos y las excepciones se integran con este filtro. No se agrega un wrapper de rutas propio de Express.

## Autenticación, roles y alcance

La autenticación es propia del backend. `auth` gestiona credenciales, inicio de sesión, renovación, cierre y revocación. `user` resuelve identidad, estado, rol, permisos vigentes y relaciones que forman el contexto del actor.

Se utilizan dos credenciales distintas: un access token JWT de duración breve y un refresh token opaco que rota al renovar. Las sesiones y los hashes de renovación se persisten en PostgreSQL. La revocación, el estado de la cuenta y la versión de credenciales se comprueban durante la autenticación.

Las contraseñas se almacenan con Argon2id. Las respuestas públicas no incluyen hashes de contraseña ni refresh tokens en JSON; el login entrega el access token en data y escribe las cookies de sesión.

### Guards compartidos

`AuthenticationGuard` y `PermissionsGuard` están registrados globalmente. Una ruta queda protegida por defecto. `@Public()` marca una excepción explícita; `@PublicRegistration()` también aplica los controles de tráfico y origen del registro.

`@RequirePermissions(...)` expresa el permiso de la operación. `@CurrentActor()` obtiene la identidad verificada y sus scopes.

Un permiso autoriza una acción, pero no cualquier recurso. El caso de uso y el adaptador deben respetar la relación real: empresa del actor, perfil propio, evento del creador o carrera asignada al administrador. Saber un UUID no demuestra propiedad.

No se confía en `x-user-id`, roles ni IDs de propietario enviados por el cliente para autenticar o atribuir recursos.

Los roles actuales son `administrador`, `titulado` y `empresa`. Mentor es una participación del titulado, no un cuarto rol de login.

### Bearer, cookies y CSRF

Las peticiones con Bearer utilizan `Authorization: Bearer <accessToken>`. Las mutaciones autenticadas mediante cookie requieren además `X-CSRF-Token`.

La renovación usa la cookie `umsspira_refresh` y el token CSRF. No se renueva una sesión enviando solamente el access token. El refresh consumido no se reutiliza; el cliente recibe cookies nuevas al renovar.

CORS se configura con orígenes explícitos desde `CORS_ORIGINS`. CORS no sustituye los permisos ni autentica peticiones.

## PostgreSQL, Prisma y UUID

`prisma/schema.prisma` contiene el esquema único del backend. No hay un schema de Prisma independiente por módulo. `prisma.config.ts` configura las conexiones para las herramientas de Prisma 7; el cliente de ejecución utiliza el adaptador PostgreSQL.

`DATABASE_URL` conecta la API al pooler de transacciones. `DIRECT_URL` conecta migraciones y scripts al pooler de sesiones. Cada equipo configura sus propias credenciales en `.env`.

Los identificadores y sus referencias usan columnas UUID nativas. Prisma las expresa como `String @db.Uuid`: String es la representación en TypeScript y @db.Uuid es el tipo de PostgreSQL. Las entradas se validan con `z.uuid()`.

Usuario, titulado y mentor tienen UUID independientes y se relacionan mediante claves foráneas. No se reutiliza el ID del usuario para identificar otra entidad.

### Qué se comparte y qué se genera

Se versionan `schema.prisma`, las migraciones SQL y los scripts de seed. El cliente generado en `src/generated/prisma`, `node_modules`, `dist` y las credenciales locales permanecen ignorados por Git.

Las bases independientes de los equipos aíslan sus datos. Los cambios de estructura siguen siendo compartidos: dos equipos que cambian una tabla deben integrar sus migraciones y el schema común de forma compatible. Un seed no aplica cambios estructurales ni resuelve conflictos de migración.

No se modifica una migración ya aplicada para introducir cambios nuevos. Los cambios posteriores se expresan en otra migración.

### Población de datos

La preparación de una base nueva requiere aplicar migraciones:

```bash
pnpm --filter api db:deploy
```

La población de demostración se ejecuta con un único comando que incluye roles, permisos, cuentas, relaciones mínimas y áreas/intereses de ejemplo:

```bash
pnpm --filter api db:seed:demo
```

Requiere `APP_ENV=epic`, `dev` o `test`. `APP_ENV` describe el destino de datos; no consulta la rama de Git. `NODE_ENV` describe el modo de Node, y cumple otra función.

Las cuentas de demostración son:

| Correo               | Contraseña   | Rol           |
| -------------------- | ------------ | ------------- |
| titulado@umss.edu.bo | titulado1234 | titulado      |
| admin@umss.edu.bo    | admin1234    | administrador |
| empresa@umss.edu.bo  | empresa1234  | empresa       |

Repetir la seed conserva las cuentas y los datos existentes. La seed normal `db:seed` prepara catálogos básicos y permisos sin crear cuentas de demostración. La producción simulada utiliza `APP_ENV=production` y no recibe esa población de datos falsos.

## Archivos, correo y Redis

Los documentos de registro, respaldos de certificaciones y portadas se guardan en PostgreSQL. La API limita tamaño y formato, verifica su acceso y entrega sus bytes. No se depende del disco efímero de un despliegue ni de Supabase Storage.

Las notificaciones usan SMTP. La cola persistida en PostgreSQL permite reintentar entregas después de reinicios. En desarrollo, Mailpit recibe los mensajes para leer códigos sin entregar correos reales.

PostgreSQL es la fuente de sesiones, identidad y permisos. Redis se utiliza únicamente cuando se selecciona su adaptador de límites. En desarrollo y test el limitador usa memoria por defecto; con varias instancias, los contadores deben compartirse mediante Redis.

`AUTH_RATE_LIMIT_STORE` permite elegir el adaptador. En producción el valor predeterminado es Redis; la configuración de demostración de una sola instancia puede seleccionar memoria explícitamente. Si se elige Redis y falla, se devuelve un error de disponibilidad; no se cambia automáticamente a memoria.

## Operaciones disponibles

| Grupo de peticiones | Operaciones | Alcance                                                                   |
| ------------------- | ----------: | ------------------------------------------------------------------------- |
| Health              |           1 | Comprobación del servidor y PostgreSQL                                    |
| Auth                |           9 | Login, identidad, sesión, renovación, revocación y contraseña             |
| User                |           1 | Usuario actual                                                            |
| Registro            |           8 | Carreras, borrador, correo, documento, envío y activación                 |
| Backoffice          |           6 | Listado, detalle, documentos, dictamen y reenvío de activación            |
| Perfil              |          10 | Formación, experiencia, certificaciones, respaldos y JSON                 |
| Empresas            |           3 | Encabezado, contacto y actualización del perfil propio                    |
| Vacantes            |           1 | Publicación                                                               |
| Mentorías           |          16 | Directorio, participación, información, áreas, intereses y disponibilidad |
| Eventos             |          11 | Catálogo, gestión propia, borradores, publicación y portadas              |
| Reportes            |           5 | Indicadores, listado, vista previa, CSV y PDF                             |

Los grupos Registro y Backoffice pertenecen al módulo `registrations`. Sus rutas utilizan namespaces distintos porque separan recursos públicos y revisión documental.

Los contratos detallados están en [docs/endpoints](endpoints/). La migración no representa la finalización de todos los requisitos del Sprint 1: siguen pendientes el autorregistro empresarial, la indexación Elasticsearch y el servicio NLP. La PWA corresponde al frontend.

## Integración del frontend y trabajo de los equipos

El frontend aún debe adaptar rutas, credenciales, sobre data y tratamiento de errores. Las rutas antiguas sin versión o con segmentos de rol no se conservan como alias.

Al extender un módulo, se mantiene la separación entre validación HTTP, coordinación de aplicación, reglas y adaptadores. Se agrega la operación al módulo Nest, se declara su permiso y se comprueba el alcance del recurso.

## Comandos habituales

Ejecutar desde la raíz del repositorio:

```bash
pnpm --filter api dev
pnpm --filter api prisma:generate
pnpm --filter api db:deploy
pnpm --filter api db:seed:demo
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
```

`prisma:generate` genera el cliente; `db:deploy` crea o actualiza tablas mediante migraciones; `db:seed:demo` inserta datos de demostración. Son acciones distintas. Ninguna ocurre por enviar una petición a /health o iniciar una sesión.
