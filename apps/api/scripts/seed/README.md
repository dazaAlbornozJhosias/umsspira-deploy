# Datos básicos y demostración por épica

Desde la raíz del repositorio:

```sh
pnpm --filter api db:seed:demo
```

`demo.ts` carga catálogos, cuentas y todos los archivos `epic-N.ts`. No hay que ejecutar un comando por equipo. Usa las conexiones de `apps/api/.env` y exige `APP_ENV=epic`, `dev` o `test`; no consulta la rama de Git. Las migraciones deben estar aplicadas y el cliente Prisma generado antes de cargar datos.

## Qué queda disponible

El administrador de demostración queda asociado a Sistemas e Informática. Si Informática ya existe, se conserva su UUID y nombre, incluidas las variantes con o sin tilde y el nombre histórico `Ingeniera Informatica`. No se crea una segunda carrera.

Para añadir únicamente Informática al administrador existente, sin cargar las demás épicas:

```sh
pnpm --filter api db:seed:informatica
```

Este comando exige `APP_ENV=epic`, `dev` o `test` y la cuenta administradora de demostración ya creada. No modifica cuentas, contraseñas ni asignaciones existentes. En bases nuevas, `db:seed:demo` ya incluye esta carga después de crear las cuentas. `db:seed` incorpora la carrera al catálogo sin crear ni asignar usuarios.

| Parte        | Datos iniciales                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Catálogos    | Roles, permisos, Ingeniería de Sistemas e Ingeniería Informática, PDF/JPG/PNG, modalidades de trabajo, áreas profesionales y tipo de reporte |
| Acceso       | Titulado, administrador y empresa con sus perfiles relacionados                                                               |
| Épica 1      | Cuatro solicitudes: pendiente, aprobada, observada y rechazada; detalles, PDF descargables, dictámenes y auditoría de ejemplo |
| Épica 2      | Formación, experiencia laboral vigente y certificación del titulado                                                           |
| Épica 3      | Descripción profesional, palabras clave, alias, pesos, término no mapeado y radar de demostración                             |
| Épicas 4 y 5 | Empresa con teléfono, dirección y sector; requerimiento con habilidad; vacante vinculada al requerimiento                     |
| Épica 6      | El titulado participa como mentor activo, con especialidad, interés y disponibilidad                                          |
| Épica 7      | Un evento publicado, un borrador del administrador y una inscripción del titulado                                             |
| Épica 8      | Reutiliza la identidad y catálogos compartidos; los dispositivos push los registra cada navegador                             |
| Épica 9      | Encuesta en borrador; indicadores y listados con las solicitudes y el mentor ya cargados                                      |

Son datos ficticios. No se generan sesiones, renovaciones, códigos de activación, correos pendientes ni suscripciones push. Los respaldos de certificación se cargan mediante el endpoint correspondiente: la certificación inicial está `sin_respaldo`. No se insertan aprobaciones sin evidencia ni archivos de reporte inexistentes.

El radar usa `version_algoritmo=demo-seed-v1`: es un ejemplo persistido, no el resultado de ejecutar el motor NLP. La seed no indexa Elasticsearch ni inicia servicios externos.

Las fechas de los eventos se calculan para 30 y 45 días después de la primera carga. Las filas existentes mantienen sus fechas cuando se repite el comando.

La seed de la épica 9 agrega 39 perfiles de titulado ficticios sin cuentas de acceso y 40 respuestas asociadas a ellos y al titulado compartido. Así se respeta la restricción de una respuesta por titulado y encuesta; repetir la carga conserva los registros existentes.

| Correo                 | Contraseña     | Rol           |
| ---------------------- | -------------- | ------------- |
| `titulado@umss.edu.bo` | `titulado1234` | titulado      |
| `admin@umss.edu.bo`    | `admin1234`    | administrador |
| `empresa@umss.edu.bo`  | `empresa1234`  | empresa       |

El mentor utiliza la cuenta de titulado; no es un rol de acceso independiente. Las solicitudes pendiente, observada y rechazada tienen contactos ficticios `example.com` y no crean cuentas adicionales.

## Dónde añadir los datos

| Archivo            | Datos                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- |
| `catalogs.ts`      | Catálogos compartidos, sin personas ni trámites de demostración                       |
| `base.ts`          | Creación de cuentas con sus perfiles                                                  |
| `demo-accounts.ts` | Cuentas de acceso de demostración y sus UUID                                          |
| `demo-ids.ts`      | UUID de catálogos y registros referenciados por varias épicas                         |
| `demo-document.ts` | Generación del PDF ficticio almacenado con cada solicitud                             |
| `epic-1.ts`        | Detalles, documentos, solicitudes, dictámenes, administradores de sistema y auditoría |
| `epic-2.ts`        | Formación, experiencia, certificaciones, respaldos y validaciones                     |
| `epic-3.ts`        | Perfiles por área, diccionario NLP y resultados de radar                              |
| `epic-4.ts`        | Empresas, contactos, sectores y requerimientos                                        |
| `epic-5.ts`        | Vacantes                                                                              |
| `epic-6.ts`        | Mentores, especialidades y disponibilidad                                             |
| `epic-7.ts`        | Eventos e inscripciones                                                               |
| `epic-8.ts`        | Registro opcional de dispositivos para un flujo real de pruebas                       |
| `epic-9.ts`        | Reportes, encuestas y respuestas laborales con titulados ficticios para pruebas       |

Cada equipo puede ampliar los arreglos tipados de su archivo. Los catálogos que consumen varios módulos se mantienen en `catalogs.ts`, para no duplicarlos en cada épica. Se conservan los UUID de las tres cuentas y las cinco áreas que ya existían.

## Cómo añadir registros

Añadir objetos al arreglo correspondiente. El tipo generado por Prisma indica qué campos existen y cuáles son obligatorios. Por ejemplo, en `epic-2.ts`:

```ts
import { DEMO_GRADUATE_ID } from './demo-accounts';

// Añadir este objeto al arreglo existente de formaciones.
const otraFormacion: Prisma.FormacionAcademicaCreateManyInput = {
  id: '22000000-0000-4000-8000-000000000010',
  id_titulado: DEMO_GRADUATE_ID,
  institucion: 'UMSS',
  titulo: 'Diplomado en gestión de proyectos',
  anio_egreso: 2026,
};
```

Generar cada UUID una vez y guardarlo en el archivo. Para las referencias, importar las constantes existentes; no generar IDs nuevos cada vez que corre la seed. Si se añaden cuentas en `demo-accounts.ts`, cada una necesita un `id` y un `profileId` propios; `careerId` debe existir en las carreras de `catalogs.ts` cuando corresponda. Se pueden añadir varias cuentas del mismo rol.

Cada tabla se inserta con `skipDuplicates` o con `upsert` sin actualizaciones: repetir el comando agrega los registros faltantes y conserva los existentes, incluidas las contraseñas. Cambiar un objeto con el mismo UUID no actualiza la fila guardada. Un conflicto de correo con otro UUID detiene la carga de cuentas.

## Relaciones y orden

Primero se crean catálogos, roles, permisos, cuentas y perfiles. Después se ejecutan las épicas en este orden: **1, 2, 6, 3, 4, 5, 7, 8, 9**. Las áreas compartidas ya existen desde la base; sus padres se crean antes que sus hijas.

Dentro de cada archivo se crean primero las tablas referenciadas y después sus dependientes. Si se incorpora otra tabla, añadir su arreglo tipado y su inserción al archivo de la épica, respetando ese orden. No crear de nuevo una cuenta o un área compartida desde otra épica: usar su UUID.

La carga no es una única transacción: si una etapa falla, las anteriores pueden haber quedado guardadas. El comando indica la etapa y puede repetirse después de corregir el problema. Los equipos deben coordinar los cambios en datos compartidos antes de integrarlos en dev; tener bases separadas no resuelve los conflictos entre archivos al unir las ramas.

Las validaciones de certificaciones se cargan en `epic-2.ts`, después de sus certificaciones. Su `id_administrador_sistema` debe existir en `administradoresSistema` de `epic-1.ts`; no es el UUID del usuario ni el de administrador de carrera. `estado_validacion` usa `sin_respaldo`, `validado` u `observado`; el historial de validación usa `con_respaldo` u `observado`, según el documento del equipo. Añadir un respaldo no equivale a una aprobación automática.

`pnpm --filter api db:seed` prepara únicamente roles, permisos y catálogos de `catalogs.ts`. Sirve también con `APP_ENV=production`; no crea usuarios, solicitudes, empresas, mentores ni eventos. `db:seed:demo` ya incluye esa carga, así que no hace falta ejecutar ambos comandos.
