# Fronteras de los módulos

Esta guía define cómo ampliar el backend de UMSSPIRA. Está escrita para estudiantes y para herramientas de IA que reciban archivos sueltos: explica dónde pertenece cada responsabilidad y cómo conectar una operación sin crear otra arquitectura dentro del proyecto.

Un módulo representa una responsabilidad del sistema, no una persona ni necesariamente una épica. Una misma épica puede necesitar varios módulos; varios equipos pueden colaborar sobre uno. Extender un módulo existente suele ser preferible a duplicarlo con el nombre del equipo o del sprint.

El backend usa arquitectura hexagonal dentro de un monolito modular: los módulos se ejecutan en la misma aplicación Nest y comparten PostgreSQL. Una carpeta de módulo no es un microservicio ni requiere su propio servidor, conexión o `schema.prisma`.

## Estructura de un módulo

Todos los caminos de este documento parten de `apps/api/`, salvo los que indiquen otra base.

```text
src/modules/
  <modulo>/
    <modulo>.module.ts
    README.md
    domain/
      entities/
      policies/
      errors/
    application/
      contracts/
      ports/
      services/
      use-cases/
    http/
      controllers/
      schemas/
      presenters/
      cookies/
      decorators/
      guards/
    infrastructure/
      providers/
      repositories/
      adapters/
      schemas/
      security/
      scripts/
      translators/
```

Crear únicamente las subcarpetas que tengan una responsabilidad real. No hacen falta carpetas vacías ni una clase por cada concepto de la lista. Tampoco se dejan archivos sueltos en la raíz de `domain`, `application`, `http` o `infrastructure`.

`<modulo>.module.ts` permanece en la raíz porque compone el módulo completo. El README del módulo explica su alcance, reglas particulares y dependencias. Esta guía fija las convenciones compartidas.

La estructura ya existente de `auth` se conserva. No se reorganizan archivos de autenticación para imitar un ejemplo de otro módulo. Para operaciones nuevas, empresas y vacantes muestran la distribución estándar.

## Qué va en cada carpeta

### Dominio

El dominio expresa qué significan los datos y qué reglas deben cumplirse, independientemente de HTTP, Nest, Prisma o PostgreSQL.

| Carpeta            | Responsabilidad                                                                                             | Ejemplo y límite                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/entities/` | Entidades, tipos y estados propios del negocio. Pueden ser interfaces o clases si necesitan comportamiento. | `company.entity.ts` describe una empresa sin importar tipos generados de Prisma. No es una copia obligatoria de todas las columnas de la tabla.         |
| `domain/policies/` | Reglas y decisiones de negocio reutilizables.                                                               | Comprobar acceso a una empresa, duplicidad académica o una transición de estado. Recibe los datos que necesita; no consulta Prisma ni lee una petición. |
| `domain/errors/`   | Errores específicos del negocio del módulo.                                                                 | `company-not-found.error.ts` deriva de un error compartido y expresa qué falta. No decide un código HTTP.                                               |

No es necesario convertir cada interfaz en una clase con getters y setters. Una regla sencilla puede ser una función pura. Las reglas importantes no deben quedar escondidas dentro de un controlador o de una consulta SQL.

### Aplicación

La aplicación coordina una operación del sistema utilizando reglas y contratos. Puede conocer tipos compartidos puros, como `ActorContext`, pero no el objeto `Request` de Express.

| Carpeta                  | Responsabilidad                                                                        | Ejemplo y límite                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `application/contracts/` | Entradas y resultados de aplicación, con campos explícitos.                            | `update-company-profile.input.ts` o `company-header.ts`. No importan schemas HTTP ni tipos de Prisma.                                                        |
| `application/ports/`     | Interfaces de las capacidades que necesita el caso de uso y sus tokens de inyección.   | `company-profile-repository.port.ts`. Describe operaciones de persistencia; no implementa consultas. También puede representar correo o un servicio externo. |
| `application/use-cases/` | Una operación de aplicación por archivo, normalmente con un método `execute`.          | `get-company-header.use-case.ts`. Comprueba alcance, aplica reglas y llama al puerto. No construye JSON HTTP ni instancia adaptadores.                       |
| `application/services/`  | Coordinación reutilizada por varios casos de uso cuando existe una necesidad concreta. | No convertir esta carpeta en un servicio gigante con todos los endpoints ni crear un service que solo repita una llamada al use case.                        |

Un puerto no es una ruta HTTP. Es un contrato TypeScript que permite sustituir una dependencia externa y probar la aplicación sin conectarse a ella.

### HTTP

Esta capa adapta una petición HTTP a una operación de aplicación y convierte su resultado en una respuesta pública. Aquí sí se usan decoradores de Nest, parámetros, headers y códigos HTTP.

| Carpeta             | Responsabilidad                                                                                     | Ejemplo y límite                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `http/controllers/` | Una operación HTTP por archivo: ruta, permiso, validación, llamada al caso de uso y respuesta.      | `get-company-header.controller.ts`. No consulta Prisma ni implementa reglas de negocio.                                                       |
| `http/schemas/`     | Schemas Zod para body, params y query, y tipos inferidos de esas entradas HTTP.                     | En módulos nuevos, reunirlos en `<modulo>.schemas.ts`. Puede haber muchas constantes en ese mismo archivo.                                    |
| `http/presenters/`  | Selección y transformación explícita de los campos que se publican.                                 | `company-header.presenter.ts`. No devolver una entidad completa ni una fila Prisma mediante un spread.                                        |
| `http/cookies/`     | Lectura, emisión o eliminación de cookies propias de un flujo que realmente las necesite.           | Las cookies de sesión pertenecen a auth. Un módulo de negocio no crea otra sesión.                                                            |
| `http/decorators/`  | Composición de metadata o extracción HTTP específica del módulo.                                    | Usar los decoradores compartidos para identidad y permisos; no duplicarlos aquí.                                                              |
| `http/guards/`      | Controles HTTP particulares del módulo cuando los controles globales no cubren esa responsabilidad. | No volver a implementar autenticación ni registrar otra vez los guards globales. El alcance sobre datos sigue comprobándose en la aplicación. |

No hay carpeta `routers/`: Nest registra las rutas mediante los decoradores de los controladores y su inclusión en `controllers` del módulo. No se agrega un router Express o Fiber paralelo.

### Infraestructura

Infraestructura resuelve cómo hablar con la base de datos, proveedores y herramientas concretas. Es donde se permite depender de Prisma, PostgreSQL, Redis, librerías criptográficas o clientes externos.

| Carpeta                        | Responsabilidad                                                                                                  | Ejemplo y límite                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `infrastructure/repositories/` | Adaptadores de persistencia que implementan puertos.                                                             | `prisma-company-profile.repository.ts` recibe el `PrismaService` compartido, filtra al propietario y ejecuta consultas y transacciones. |
| `infrastructure/adapters/`     | Implementaciones de puertos para servicios externos o fronteras entre módulos cuando se necesita una adaptación. | Un cliente HTTP para un servicio NLP. No agregar una integración que la tarea todavía no requiere.                                      |
| `infrastructure/translators/`  | Conversión entre registros o mensajes externos y modelos o contratos internos.                                   | `company.translator.ts` convierte `razon_social` a `legalName`. Aquí pueden aparecer tipos Prisma y selecciones de columnas.            |
| `infrastructure/providers/`    | Registro de implementaciones y factories de Nest para construir los casos de uso.                                | `companies.providers.ts` conecta un token de puerto con un repositorio. No contiene reglas del negocio.                                 |
| `infrastructure/schemas/`      | Validación de formatos procedentes de una dependencia externa, si hace falta.                                    | No colocar aquí los schemas del body HTTP. Un formato de token o una respuesta de proveedor tiene otra frontera.                        |
| `infrastructure/security/`     | Adaptadores concretos de seguridad utilizados por el módulo.                                                     | Auth concentra hashing y tokens. Los demás módulos consumen la identidad ya verificada.                                                 |
| `infrastructure/scripts/`      | Utilidades particulares de un adaptador si no corresponden a un script general del backend.                      | Las seeds compartidas están en `scripts/seed/`; no se duplican ni se ejecutan al importar un módulo.                                    |

Un **translator** adapta datos de una dependencia hacia el interior. Un **presenter** decide qué datos salen por HTTP. No se llaman ambos `mapper` ni se usa uno como sustituto del otro.

## Herramientas acordadas

| Herramienta                     | Uso en este backend                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript y Node.js            | TypeScript estricto. La API exige Node 22.12 o posterior; las versiones concretas de dependencias están en `package.json` y el lockfile.       |
| NestJS 10 con adaptador Express | Controladores, módulos, inyección, guards, pipes y filtro global. No se crea otra aplicación Express dentro de un módulo.                      |
| Prisma 7 y `@prisma/adapter-pg` | Acceso a PostgreSQL desde adaptadores de infraestructura. El ORM no reemplaza los casos de uso ni las reglas.                                  |
| PostgreSQL alojado en Supabase  | Persistencia. No usar Supabase Auth, su SDK como acceso paralelo a tablas ni Storage para sustituir el almacenamiento actual.                  |
| Zod 4                           | Validación y transformación de entradas. Se utiliza el `ZodValidationPipe` compartido, no DTOs con `class-validator` o `class-transformer`.    |
| Autenticación propia            | Access token, renovación y sesiones persistidas gestionadas por auth. Los módulos reciben `ActorContext`; no verifican JWT por su cuenta.      |
| Redis                           | Adaptador de límites cuando se configura. Las sesiones y permisos se consultan en PostgreSQL; no añadir Redis como dependencia de cada módulo. |
| Jest y Supertest                | Reglas y flujos HTTP con dependencias sustituibles. Las pruebas no deben conectarse a la BD real de un equipo.                                 |
| Bruno                           | Peticiones manuales por módulo en la carpeta `bruno/` de la raíz del repositorio. No es una colección de casos de prueba por cada variante.    |
| pnpm, ESLint y Prettier         | Comandos del workspace, revisión estática y formato. No incorporar otro gestor ni cambiar las versiones para resolver una tarea de módulo.     |

Las variables se validan en `src/config/environment.ts`; `.env.example` explica su configuración. La infraestructura puede recibir configuración desde Nest y pasar valores al adaptador. No se leen credenciales con `process.env` dentro de reglas o casos de uso.

## Recorrido de una petición y dirección de dependencias

1. Los guards compartidos comprueban sesión y permisos.
2. El pipe valida y transforma params, query o body con Zod.
3. El controlador obtiene el actor verificado y llama a un caso de uso.
4. El caso de uso comprueba el alcance y aplica reglas de dominio.
5. Un adaptador implementa el puerto y resuelve la operación externa.
6. El translator convierte los datos externos en un resultado interno.
7. El presenter selecciona los campos públicos y el controlador devuelve la respuesta.

```text
http -----------> application -----------> domain
infrastructure -> application y domain

<modulo>.module.ts e infrastructure/providers conectan las implementaciones.
```

`domain` y `application` no importan controladores, Nest, Express, clientes Prisma ni repositorios concretos. Los tipos generados se quedan dentro del adaptador y del translator. Una salida de aplicación puede ser una entidad o un contrato de lectura específico; no es necesario fabricar una entidad completa para consultar cuatro campos.

Los errores recorren el camino inverso hasta el filtro global. Los casos de uso lanzan errores de aplicación, no respuestas HTTP.

## Rutas y controladores

La forma es `/api/v1/<namespace>/<recurso>`. El prefijo global se configura una sola vez en `src/shared/http/configuration/configure-http.ts`. La excepción existente es `/health`.

Cada controlador declara solamente su namespace:

```ts
@Controller('companies')
```

No escribir `@Controller('api/v1/companies')`, porque duplicaría el prefijo. Tampoco agregar segmentos como `admin`, `titulado`, el nombre del equipo o el número de épica para expresar permisos.

Estos son los namespaces actuales; conservarlos al extender operaciones:

| Módulo          | Namespace bajo `/api/v1`                                                            |
| --------------- | ----------------------------------------------------------------------------------- |
| `auth`          | `auth`                                                                              |
| `user`          | `user`                                                                              |
| `companies`     | `companies`                                                                         |
| `job-postings`  | `job-postings`                                                                      |
| `registrations` | `registrations`, `applications`, `email-verification` y `documents`, según el flujo |
| `profile`       | `perfil`                                                                            |
| `events`        | `events`                                                                            |
| `mentorship`    | `mentorship`                                                                        |
| `reports`       | `reports`                                                                           |

La existencia de nombres en español e inglés no autoriza a renombrar rutas ya acordadas. Para un módulo nuevo se define un único namespace estable. No crear alias de rutas antiguas ni modificar contratos de otros equipos como parte de una tarea distinta.

`@Get` consulta sin modificar estado; `@Post` crea o ejecuta la operación declarada; `@Put` y `@Patch` modifican según el contrato; `@Delete` elimina. Se respeta el verbo ya definido para una operación existente. El código de respuesta también se declara según el contrato: Nest usa 201 por defecto en POST; si una acción debe responder 200 se indica con `@HttpCode(200)`.

Un archivo contiene un controlador con una operación HTTP. Varios controladores del mismo módulo pueden repetir `@Controller('companies')`; se distinguen por su verbo y subruta. No repetir la misma combinación de verbo y ruta. Al registrar rutas parametrizadas, evitar que capturen rutas fijas como catálogos o resúmenes.

## Validación con Zod

Los módulos nuevos reúnen sus schemas HTTP en `http/schemas/<modulo>.schemas.ts`. No hace falta un archivo por constante. Auth conserva su organización actual.

```ts
import { z } from 'zod';

export const companyIdSchema = z.uuid();

export const updateCompanyProfileSchema = z
  .strictObject({
    razonSocial: z.string().trim().min(1).max(100).optional(),
    correo: z.string().trim().toLowerCase().max(254).pipe(z.email()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type UpdateCompanyProfileBody = z.output<typeof updateCompanyProfileSchema>;
```

Este fragmento muestra la mecánica de validación; el schema existente de empresas tiene más campos y se conserva. Un ejemplo reducido no debe reemplazar el contrato completo de una operación.

- Validar body, parámetros y query antes de usarlos. El tipado TypeScript por sí solo no valida una petición.
- Utilizar `z.uuid()`, no una expresión regular manual para UUID.
- Definir límites y los campos obligatorios, opcionales y anulables según el contrato. `optional()` permite ausencia; `nullable()` permite `null`; no son equivalentes.
- Rechazar campos desconocidos con objetos estrictos cuando el contrato enumera los campos aceptados.
- Query y params llegan como texto. Transformarlos explícitamente cuando corresponda; no confiar en que `"false"` sea un booleano falso.
- La validación de formato no sustituye una regla que necesita consultar el estado actual, comprobar propiedad o evitar concurrencia.
- Inferir los tipos HTTP con `z.output`. Los contratos de aplicación siguen siendo independientes de la carpeta HTTP; no importar el schema desde un caso de uso.
- No aceptar un rol, permiso, estado de aprobación o propietario arbitrario mediante un body si el flujo no permite que ese actor lo decida.

## Ejemplo de un controlador protegido

Este ejemplo corresponde a `companies/http/controllers/get-company-header.controller.ts`. Las rutas de importación parten de esa ubicación:

```ts
import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetCompanyHeaderUseCase } from '../../application/use-cases/get-company-header.use-case';
import { companyIdSchema } from '../schemas/companies.schemas';
import { presentCompanyHeader } from '../presenters/company-header.presenter';

@Controller('companies')
export class GetCompanyHeaderController {
  constructor(private readonly useCase: GetCompanyHeaderUseCase) {}

  @Get(':companyId/header')
  @RequirePermissions('empresas:self:read')
  async getHeader(
    @CurrentActor() actor: ActorContext,
    @Param('companyId', new ZodValidationPipe(companyIdSchema)) companyId: string,
  ) {
    const result = await this.useCase.execute(actor, companyId);
    return { data: presentCompanyHeader(result) };
  }
}
```

La ruta final es `GET /api/v1/companies/:companyId/header`. Para validar un body se usa `@Body(new ZodValidationPipe(schema))`; para query, `@Query(new ZodValidationPipe(schema))`, importando ambos decoradores desde Nest.

El controlador no necesita un `try/catch` que convierta cualquier error en 500, un wrapper Express para promesas ni acceso a la conexión. Las excepciones llegan al filtro global.

## Permisos, sesión y alcance

`AuthenticationGuard` y `PermissionsGuard` se registran globalmente en auth. No se agregan de nuevo a cada módulo.

`@RequirePermissions(...)` exige **todos** los permisos indicados, no cualquiera de ellos. Un controlador sin ese decorador sigue requiriendo autenticación, pero no gana automáticamente una comprobación de permiso de negocio. Las operaciones nuevas deben declarar el permiso que corresponda.

`@Public()` omite ambos guards globales. Se utiliza únicamente cuando el recurso debe ser público según el requisito; no sirve para arreglar un 401 durante desarrollo. Una ruta pública no dispone automáticamente de `@CurrentActor()`. Si un flujo permite identidad opcional, usar el mecanismo compartido ya existente y comprobar el acceso en su aplicación.

El permiso concede una operación; el alcance determina **sobre qué datos** puede ejecutarse:

- `actor.id` identifica al usuario autenticado.
- `actor.scopes.graduateId` identifica su titulado, si existe.
- `actor.scopes.companyIds` contiene las empresas a las que tiene acceso.
- `actor.scopes.careerIds` contiene las carreras que puede gestionar o consultar.
- Son referencias distintas. El UUID de un usuario no se reutiliza como UUID de titulado, empresa o mentor.

En el ejemplo, el caso de uso comprueba que `companyId` pertenezca a `actor.scopes.companyIds`. El repositorio consulta además con `where: { id: companyId, id_usuario: actor.id }`. Así se verifica la relación real de los datos al acceder a persistencia.

No confiar en headers como `x-user-id` o `x-company-id`, ni en un ID recibido por URL como prueba de propiedad. Tampoco conceder acceso universal solo porque `actor.role` sea administrador: cada flujo conserva su alcance.

Los permisos iniciales se declaran en `src/modules/user/domain/policies/access.policy.ts` y se cargan mediante la seed de catálogo. Añadir solamente un texto nuevo a `@RequirePermissions` no lo asigna a ningún rol. Si una funcionalidad necesita un permiso nuevo, coordinar su incorporación al catálogo y su asignación explícita; no inventar roles para sortear permisos.

Las llamadas con Bearer envían `Authorization: Bearer <accessToken>`. Las mutaciones autenticadas con cookie requieren además `X-CSRF-Token`. La renovación, revocación y comprobación de sesiones pertenecen a auth. CORS se configura globalmente desde `CORS_ORIGINS`; no se abre desde un módulo para evitar un error de integración.

## Puertos, adaptadores y composición en Nest

Una interfaz TypeScript desaparece al ejecutar JavaScript. Por eso el puerto exporta también un token:

```ts
// application/ports/company-profile-repository.port.ts
import type { CompanyHeader } from '../contracts/company-header';

export const COMPANY_PROFILE_REPOSITORY = Symbol('COMPANY_PROFILE_REPOSITORY');

export interface CompanyProfileRepository {
  findHeader(companyId: string, ownerId: string): Promise<CompanyHeader | null>;
}
```

El fragmento muestra una operación del puerto; un puerto real puede agrupar varias operaciones relacionadas. No necesita ser un CRUD genérico ni copiar toda la API de Prisma.

El caso de uso recibe `CompanyProfileRepository` por constructor, sin `@Injectable`, `@Inject` ni referencias a Prisma. El adaptador `PrismaCompanyProfileRepository` implementa esa interfaz, puede usar `@Injectable()` y recibe `PrismaService`.

En `infrastructure/providers/companies.providers.ts`, el registro correspondiente tiene esta forma:

```ts
export const companiesProviders: Provider[] = [
  PrismaCompanyProfileRepository,
  {
    provide: COMPANY_PROFILE_REPOSITORY,
    useExisting: PrismaCompanyProfileRepository,
  },
  {
    provide: GetCompanyHeaderUseCase,
    inject: [COMPANY_PROFILE_REPOSITORY],
    useFactory: (repository: CompanyProfileRepository) => new GetCompanyHeaderUseCase(repository),
  },
];
```

`Provider` se importa como tipo desde `@nestjs/common`; el token y la interfaz proceden del puerto, el caso de uso de `application/use-cases` y el repositorio de `infrastructure/repositories`.

`companies.module.ts` importa `PrismaModule`, registra el controlador en `controllers` y la lista anterior en `providers`. Un módulo nuevo se importa además en `src/app.module.ts`. Añadir un archivo a una carpeta no lo registra automáticamente.

Solo se exportan providers que otro módulo necesite mediante un contrato público. Entre módulos no se importan repositorios concretos ni entidades generadas. Por ejemplo, auth consume la lectura de identidad expuesta por user en vez de consultar sus tablas desde un controlador.

Si dos módulos necesitan colaborar, definir el contrato, exportar su provider e importar el módulo que lo ofrece. No usar `forwardRef`, dependencias circulares, un servicio global o acceso directo a tablas ajenas como primera solución.

## Persistencia y modelos de Prisma

Hay un único `prisma/schema.prisma` para el backend. Contiene modelos, campos, relaciones, índices y enums persistidos de todas las épicas. No se crea un schema por módulo ni una carpeta `models` con copias manuales del cliente.

- El cliente se genera en `src/generated/prisma/`, que está ignorado por Git. No se edita ni se versiona.
- Los adaptadores reciben el `PrismaService` de `shared/infrastructure/database/`. No instanciar un `PrismaClient` o un pool por controlador, petición o módulo.
- Un UUID nativo aparece como `String @db.Uuid` en Prisma. TypeScript lo representa como string; eso no significa que la columna sea texto.
- Para IDs nuevos usar los defaults UUID existentes o `randomUUID()` de `node:crypto`, según el flujo. Las seeds conservan UUID fijos para reproducir relaciones.
- Seleccionar solo las columnas necesarias. No cargar bytes de archivos en resúmenes ni traer credenciales para construir una respuesta de perfil.
- El repositorio devuelve contratos internos mediante un translator. No devolver `Prisma.EmpresaGetPayload`, transacciones o builders de consultas por el puerto.
- Una operación que necesita varias escrituras atómicas se resuelve dentro del adaptador y su transacción. No hacer llamadas HTTP externas dentro de una transacción abierta.
- Las comprobaciones sujetas a concurrencia necesitan una restricción, operación atómica o bloqueo apropiado. Un `find` seguido de un `create` no garantiza por sí solo que no haya duplicados.
- Un SQL puntual debe estar parametrizado. No concatenar entradas del cliente ni usar variantes `Unsafe` para construir consultas.

Compartir PostgreSQL no convierte todas las tablas en propiedad de todos los módulos. Tener bases independientes por equipo tampoco evita conflictos entre cambios del schema común.

Los cambios estructurales se entregan con una migración nueva en `prisma/migrations/`. No modificar migraciones ya aplicadas, resetear la base o sustituirlas por `db push` para ocultar diferencias. Revisar especialmente cambios de tipo, longitudes, nulabilidad, claves únicas y borrados en cascada.

Las seeds viven en `scripts/seed/`, fuera de `src/modules`. Cada equipo amplía su `epic-N.ts` respetando referencias y orden de carga. Se ejecutan explícitamente, no al iniciar Nest. `db:seed:demo` incluye todas las épicas y el catálogo; `APP_ENV` describe el entorno de datos, no la rama Git.

## Respuestas, presenters y errores

Las respuestas JSON de negocio usan el sobre `data`:

```json
{
  "data": {
    "nombre": "Empresa de ejemplo",
    "eslogan": null,
    "logoUrl": null,
    "bannerUrl": null
  }
}
```

El presenter enumera los campos permitidos, incluso cuando solo cambia nombres. No devolver `{ ...usuario }`, `{ ...filaPrisma }` o el objeto completo de una dependencia. Nunca publicar hashes, tokens internos, versiones de credenciales o detalles del almacenamiento.

No cambiar el sobre, los nombres, los valores nulos ni el formato de una colección existente sin actualizar el contrato y sus consumidores. Las descargas de archivos, exportaciones y `/health` conservan su formato específico; no se envuelven sus bytes en `data`.

Los errores JSON los construye el filtro global:

```json
{
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "No se encontró la empresa"
  }
}
```

Un error de Zod agrega `error.fields`, un objeto cuyas claves son rutas de campos y cuyos valores son listas de mensajes. Los códigos de error son estables, en mayúsculas con guiones bajos; los mensajes destinados al cliente se escriben en español.

Reutilizar los errores compartidos según su significado:

| Error                        | Uso                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `BusinessRuleError`          | Regla incumplida, con una razón como `invalid`, `conflict`, `missing` o `forbidden`.           |
| `ResourceNotFoundError`      | Recurso ausente; el módulo puede derivar un error más específico.                              |
| `AccessError`                | Fallos de acceso reconocidos por el mecanismo compartido.                                      |
| `DependencyUnavailableError` | Dependencia necesaria que no está disponible.                                                  |
| `ValidationError`            | Errores de entrada; el pipe ya convierte los errores de Zod.                                   |
| `HttpError`                  | Detalle del borde HTTP; no se utiliza para expresar una regla dentro del dominio o aplicación. |

El filtro `shared/http/filters/error-handler.filter.ts` traduce estos errores y varios errores conocidos de Prisma. También uniforma las rutas inexistentes y oculta detalles internos de los errores inesperados. Extender `AppError` sin definir cómo se traduce no basta: un error sin traducción explícita termina como error interno.

No capturar una excepción para devolver `{ success: false }` con estado 200, una lista vacía o un mensaje distinto por controlador. Capturar solo cuando exista una recuperación concreta o una traducción de infraestructura necesaria; en los demás casos propagar al filtro. Los registros no deben volcar contraseñas, tokens, URLs de conexión ni el body completo.

## Qué se comparte y qué permanece en el módulo

`src/shared/` contiene errores, contexto de identidad, guards, decoradores, pipe Zod, configuración HTTP, contratos de archivos y acceso común a infraestructura. No crear una carpeta paralela `common/` ni copiar estos mecanismos en cada épica.

Una regla o tipo que solo pertenece a una responsabilidad permanece en su módulo. No moverlo a shared solo porque tenga un nombre genérico. Para atravesar módulos se usa un contrato de aplicación, con una dependencia explícita.

Los archivos privados actuales se almacenan mediante los adaptadores existentes en PostgreSQL. Un campo llamado `archivo_key` en el schema no autoriza a crear un bucket ni a usar Supabase Storage. Para uploads se conservan límites de tamaño, tipos permitidos, comprobación de contenido y autorización al descargar.

## Nombres y legibilidad

- Carpetas y archivos en `kebab-case`: `get-company-header.use-case.ts`, `company-profile-repository.port.ts` y `prisma-company-profile.repository.ts`.
- Clases e interfaces en `PascalCase`; propiedades, funciones y métodos TypeScript en `camelCase`; tokens de inyección en mayúsculas.
- Se respetan los nombres de columnas definidos en Prisma y los campos del contrato HTTP. El translator y el presenter adaptan entre esos vocabularios sin renombrar el contrato.
- Un caso de uso y una operación HTTP por archivo. Los schemas de un módulo pueden compartir un archivo y los puertos pueden tener varias operaciones relacionadas.
- Una propiedad por línea en interfaces y objetos extensos; parámetros y expresiones en varias líneas cuando mejoren la lectura. No comprimir interfaces, funciones y clases enteras en una línea.
- No usar `any`, casts dobles o assertions para esconder una incompatibilidad de producción. Tipar el contrato y resolver la conversión en su frontera.
- Los comentarios explican una regla, decisión o condición que el código no hace evidente. Los README explican la arquitectura. No dejar comentarios dirigidos a quien encargó el cambio ni conversaciones con una IA en el código.
- No introducir carpetas alternativas `presentation`, `interfaces/http`, `handlers` o `mappers` para una misma responsabilidad ya cubierta por `http`, `controllers`, `presenters` y `translators`.

## Cómo añadir una operación

1. Identificar el módulo responsable y el requisito concreto. Confirmar la ruta, verbo, entrada, salida, permiso y alcance; conservar los contratos existentes que no forman parte del cambio.
2. Expresar las reglas necesarias en dominio y definir entradas, salidas y puertos en aplicación.
3. Crear el caso de uso, con el alcance derivado del actor y sin dependencias HTTP o Prisma.
4. Implementar o ampliar el adaptador; filtrar los datos por su relación real y definir la transacción si hace falta.
5. Añadir los schemas necesarios al archivo HTTP del módulo, un controlador propio para la operación y el presenter.
6. Registrar la operación en providers y en el módulo Nest. Si el módulo es nuevo, importarlo en `AppModule`.
7. Si cambió persistencia, actualizar schema y entregar una migración nueva. Añadir los datos de demostración en la seed de la épica si se necesitan.
8. Documentar el endpoint con `docs/endpoints/reporte-endpoints-plantilla.md` y actualizar el README del módulo. Añadir o actualizar su petición Bruno, por módulo y por operación.
9. Verificar el cambio con los comandos pertinentes y pruebas que comprueben el comportamiento, el acceso y los casos relevantes de esa operación.

En Bruno se sigue el formato de la colección existente: variables en `collection.bru`, valores completados manualmente y archivos por endpoint dentro del módulo. No agregar scripts que capturen o asignen automáticamente tokens o IDs, ni multiplicar peticiones para representar todos los casos borde.

Desde la raíz del repositorio:

```sh
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
```

Ejecutar los checks pertinentes al alcance. En pruebas HTTP pueden sustituirse los puertos por implementaciones en memoria o dobles mediante el módulo de testing de Nest; los guards y contratos se comprueban sin acceder al Supabase real. No escribir pruebas que solo repitan la implementación.

Para un cambio de schema, además:

```sh
pnpm --filter api prisma:validate
pnpm --filter api db:migrate --name descripcion_del_cambio
```

`db:migrate` crea y aplica la migración en la base de desarrollo configurada; no se ejecuta contra una base compartida o de producción por conveniencia. Una migración ya entregada se aplica con `pnpm --filter api db:deploy`; el cliente se genera con `pnpm --filter api prisma:generate`. El schema y las migraciones se versionan; el cliente generado, las credenciales y los artefactos de build no.

## Al trabajar con archivos sueltos y una IA

Este README describe el estándar; un archivo aislado no demuestra que toda la operación esté registrada o que exista su dependencia. Antes de completar un archivo, ubicar su módulo, puerto, caso de uso, controlador y registro de providers. Si esos archivos no están disponibles, indicar qué contrato falta en vez de inventar interfaces incompatibles o afirmar que la integración ya funciona.

Al recibir código de otro lenguaje o proyecto, trasladar la intención a Nest y a estas fronteras. Por ejemplo, un middleware de permisos de Fiber se representa aquí con los guards y decoradores compartidos; no se copia como router ni se instala Fiber, otro framework o una autenticación paralela.

Una entrega debe indicar qué operación cambió, su ruta final, su permiso, si requiere migración y cómo se comprobó. No ampliar otros módulos, implementar requisitos de sprints posteriores, modificar el frontend o cambiar las convenciones para completar una tarea acotada.

Cuando una tabla, campo o endpoint nuevo todavía no tiene un contrato claro, describir la duda concreta. No resolverla renombrando recursos existentes, exponiendo campos internos o desactivando controles.
