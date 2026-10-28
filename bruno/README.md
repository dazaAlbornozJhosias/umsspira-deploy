# UMSSPIRA en Bruno

Esta colección contiene 79 peticiones, una por operación HTTP existente. Los archivos se agrupan por módulo o responsabilidad. Se utilizan manualmente desde Bruno; la carpeta NLP incluye scripts de prueba para validar el contrato de `POST /api/v1/nlp/extract`. El resto de las peticiones no contiene scripts ni captura de variables.

## Abrir la colección

1. Inicia la API con `pnpm --filter api dev`.
2. Abre esta carpeta como colección de Bruno, seleccionando su `bruno.json`.
3. Completa `vars:pre-request` de `collection.bru` con los valores compartidos.
4. Completa `vars:pre-request` del `folder.bru` del módulo que utilizarás. No hace falta seleccionar un entorno.
5. Abre la petición del módulo y envíala.

`baseUrl` contiene únicamente el origen, por defecto `http://localhost:3000`, sin barra final. Los archivos ya incluyen `/api/v1` o `/health` según corresponda.

Los cuerpos contienen datos de ejemplo editables. Las referencias `{{variable}}` se resuelven con los valores que hayas escrito. Los filtros desmarcados en Params son opcionales y no se envían hasta habilitarlos.

## Módulos

| Carpeta    | Peticiones | Uso                                                               |
| ---------- | ---------: | ----------------------------------------------------------------- |
| Health     |          1 | Estado del servidor y su conexión a PostgreSQL                    |
| Auth       |          9 | Inicio de sesión, renovación y administración de sesiones propias |
| User       |          1 | Identidad, permisos y scopes actuales                             |
| Registro   |          8 | Registro público, verificación, documento y activación            |
| Backoffice |          6 | Revisión documental por administrador                             |
| Perfil     |         10 | Perfil profesional del titulado                                   |
| Empresas   |          3 | Perfil de la empresa autenticada                                  |
| Vacantes   |          1 | Publicación de vacante por empresa                                |
| Mentorias  |         16 | Perfil y participación del mentor; gestión administrativa         |
| Eventos    |         12 | Catálogo público, gestión propia e inscripción de Titulados       |
| Reportes   |          5 | Indicadores y exportaciones por carreras autorizadas              |
| NLP        |          8 | Extracción de keywords con casos 200, 400, 401 y 403              |

`folder.bru` ordena la carpeta; cada archivo numerado representa un endpoint. Las instrucciones particulares están en la pestaña Docs de la petición.

## Dónde se asignan los valores

Se sigue la distribución del ejemplo Bruno2: variables compartidas en collection.bru y variables propias en folder.bru. `vars:pre-request` declara valores manuales; no ejecuta un script ni extrae respuestas. Las peticiones referencian esos valores con `{{nombre}}`.

| Archivo              | Valores                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| collection.bru       | baseUrl, accessToken, refreshToken, csrfToken, newPassword, careerId, companyId, applicationId                                       |
| Auth/folder.bru      | email, password, sessionId                                                                                                           |
| Registro/folder.bru  | registrationEmail, sessionToken, registrationCode, documentType, registrationFilePath, documentId, documentSizeBytes, activationCode |
| Perfil/folder.bru    | profileSection, profileRecordId, certificationId, certificationFilePath                                                              |
| Mentorias/folder.bru | mentorId, mentorAreaId, mentorInterestId                                                                                             |
| Eventos/folder.bru   | eventId, eventCoverId, eventCoverFilePath, eventStartDate, eventEndDate                                                              |
| Reportes/folder.bru  | reportStatus                                                                                                                         |

Las otras carpetas utilizan los valores compartidos. Por ejemplo, Empresas y Vacantes usan el mismo companyId; Registro y Backoffice comparten applicationId. No se duplica accessToken en las peticiones ni se utiliza una segunda variable auth.

## Carpeta NLP

`NLP` usa `{{accessToken}}` y el mismo `baseUrl` del resto de la colección. Ejecuta `001-extract-keywords` con un token de titulado o administrador. Para el caso 403, copia temporalmente el token de `empresa@umss.edu.bo`; para el 401, `002-sin-token` no envía Authorization. Los casos 400 cubren texto de 5001 caracteres, campo extra y `text` que no es cadena. No se guardan tokens reales en los archivos.

## Variables de autenticación

| Variable     | Qué escribir manualmente                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| baseUrl      | Origen de la API, como http://localhost:3000                                 |
| email        | Correo de la cuenta con la que iniciarás sesión                              |
| password     | Contraseña actual de esa cuenta                                              |
| newPassword  | Nueva contraseña de 15 a 128 caracteres, para cambiarla o activar una cuenta |
| accessToken  | Valor de data.accessToken de Login o Renovar sesión, sin el prefijo Bearer   |
| refreshToken | Valor de la cookie umsspira_refresh recibida en Login o Renovar sesión       |
| csrfToken    | Valor de la cookie umsspira_csrf de esa misma sesión                         |
| sessionId    | UUID de una sesión obtenida en Listar sesiones propias                       |

Login devuelve el access token en JSON y las cookies en los headers `Set-Cookie`. Copia solo el valor de cada cookie, sin su nombre ni atributos como Path o HttpOnly.

Las rutas protegidas ya tienen Bearer configurado con `accessToken`. Consultar sesión persistida y Renovar sesión envían una cabecera Cookie explícita con `refreshToken`; Renovar también envía `X-CSRF-Token`.

Si utilizas el almacén de cookies de Bruno, conserva una sola cookie de renovación para la sesión elegida y evita duplicarla con una segunda cabecera Cookie. Las variables de esta colección no se actualizan desde ese almacén.

Al renovar debes copiar nuevamente el access token, refresh token y CSRF de la respuesta. Cambiar contraseña, cerrar sesión o revocarla invalida las credenciales correspondientes.

### Elegir el rol

Completa email/password en Auth/folder.bru y ejecuta Login con la cuenta que necesites. Copia su token a accessToken en collection.bru antes de utilizar el módulo.

| Cuenta de demostración | Contraseña   | Módulos habituales                                        |
| ---------------------- | ------------ | --------------------------------------------------------- |
| titulado@umss.edu.bo   | titulado1234 | Perfil y mentorías propias                                |
| admin@umss.edu.bo      | admin1234    | Backoffice, eventos, reportes y desactivación de mentores |
| empresa@umss.edu.bo    | empresa1234  | Empresas y vacantes                                       |

Estas cuentas existen después de ejecutar `pnpm --filter api db:seed:demo` sobre la base configurada. Los UUID de recursos se obtienen de las respuestas del entorno que estés utilizando.

## Variables de registro y backoffice

| Variable             | Qué escribir manualmente                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| careerId             | UUID de Listar carreras; para reportes, debe ser una carrera asignada al administrador   |
| registrationEmail    | Correo del egresado que registrarás                                                      |
| sessionToken         | data.sessionToken de Crear borrador de registro                                          |
| registrationCode     | Los seis dígitos del correo de verificación                                              |
| documentType         | titulo_provision_nacional, diploma_academico o certificado_egreso                        |
| registrationFilePath | Ruta local al PDF, PNG o JPG que adjuntarás                                              |
| documentId           | data.path de Cargar documento de respaldo                                                |
| documentSizeBytes    | data.sizeBytes de esa misma carga, como número entero                                    |
| applicationId        | data.idSolicitud de Enviar solicitud, o UUID de una solicitud del listado del backoffice |
| activationCode       | Los seis dígitos del correo posterior a la aprobación o reenvío de activación            |

Aunque los endpoints de correo llaman a un campo `registrationId`, su valor es el mismo `sessionToken` del borrador. No necesitas otra variable.

En Enviar solicitud, `rutaStorage` recibe `documentId`, un UUID del archivo persistido. `sizeBytes` se interpola sin comillas para enviarlo como número.

### Recorrido manual de registro

1. Lista carreras y copia careerId. Completa registrationEmail y adapta los demás datos del egresado en Crear borrador.
2. Crea el borrador y copia sessionToken.
3. Solicita el código, lee el correo y completa registrationCode. Verifica el correo.
4. Completa registrationFilePath y carga el documento. Copia documentId y documentSizeBytes.
5. Envía la solicitud y copia applicationId.
6. Inicia sesión como administrador, copia su accessToken y emite el dictamen desde Backoffice.
7. Para una aprobación, completa activationCode y newPassword y utiliza Activar cuenta aprobada en Registro. Luego puedes iniciar sesión con la cuenta nueva.

En desarrollo, los correos se leen en Mailpit, `http://localhost:8025`, después de iniciar `docker compose up -d mailpit`.

## Variables de perfil, empresas y mentorías

| Variable              | Qué escribir manualmente                                          |
| --------------------- | ----------------------------------------------------------------- |
| companyId             | UUID de scopes.companyIds en Me con la cuenta de empresa          |
| profileSection        | formacion-academica, experiencia-laboral o certificaciones        |
| profileRecordId       | UUID del registro de esa sección                                  |
| certificationId       | UUID de la certificación a la que pertenece el respaldo           |
| certificationFilePath | Ruta local al respaldo JPG                                        |
| mentorId              | UUID del perfil de mentor; es distinto del usuario y del titulado |
| mentorAreaId          | UUID de un área raíz del catálogo de mentorías                    |
| mentorInterestId      | UUID de un interés del catálogo de las áreas seleccionadas        |

Las operaciones genéricas de Perfil usan profileSection y profileRecordId. Actualizar registro del perfil trae un body de formación académica; para otra sección utiliza los campos del archivo de creación de esa sección, en el mismo body, sin un objeto envolvente.

Para mentorías, activa la participación del titulado antes de gestionar áreas y disponibilidad. Selecciona áreas y después consulta su catálogo de intereses. Cambiar participación y Cambiar disponibilidad permiten editar el estado en el mismo archivo.

## Variables de eventos y reportes

| Variable           | Qué escribir manualmente                                            |
| ------------------ | ------------------------------------------------------------------- |
| eventId            | UUID del evento creado o consultado                                 |
| eventCoverId       | data.id de Cargar portada                                           |
| eventCoverFilePath | Ruta local a una portada JPG, PNG o WebP                            |
| eventStartDate     | Fecha inicial ISO con zona horaria, como 2027-01-20T09:00:00-04:00  |
| eventEndDate       | Fecha final ISO posterior al inicio, como 2027-01-20T18:00:00-04:00 |
| reportStatus       | PENDIENTE, APROBADA, OBSERVADA o RECHAZADA                              |

Crear evento trae estado BORRADOR. Si quieres utilizar una portada cargada, agrega al body de creación o edición:

```json
{
  "imageUrl": "/api/v1/events/covers/{{eventCoverId}}"
}
```

Ese campo se agrega junto con los demás campos del evento. La carga devuelve también la referencia completa en data.imageUrl.

Leer portada incluye Bearer para previsualizar cargas privadas propias. Para una portada publicada puedes elegir No Auth en esa misma petición.

Reportes incluye filtros opcionales de carrera, estado y búsqueda. Habilita los que necesites en Params. CSV/PDF son respuestas descargables y no tienen el sobre JSON data; guarda o visualiza su respuesta desde Bruno.

## Archivos y sintaxis

Las tres cargas usan `body: multipartForm` y `body:multipart-form`. Sus campos de archivo son `@file({{registrationFilePath}})`, `@file({{certificationFilePath}})` y `@file({{eventCoverFilePath}})`. No se fija Content-Type manualmente: Bruno construye la cabecera multipart con su boundary.

En Windows puedes escribir rutas absolutas con barras normales, por ejemplo `C:/Users/Estudiante/Downloads/respaldo.pdf`. Completa la ruta o selecciona el archivo en Body. Todas las cargas admiten hasta 5 MiB; el respaldo de certificación admite JPG.

Los cuerpos JSON, autenticación Bearer, parámetros deshabilitados y multipart siguen el [formato oficial de Bruno](https://github.com/usebruno/bruno/blob/main/packages/bruno-lang/v2/src/jsonToBru.js).

La carpeta bruno está ignorada por el .gitignore actual del repositorio. Esta colección local no aparecerá en los cambios de Git mientras se mantenga esa regla.
