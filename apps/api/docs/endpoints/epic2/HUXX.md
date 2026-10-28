# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Perfil de egresado · **Prefijo:** `/api/v1/perfil`
**Éxito:** `{ "data": ... }`, excepto descarga JSON y archivo binario.
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación agrega `fields`.

## Endpoints

- `GET /api/v1/perfil` — resumen propio.
- `POST /api/v1/perfil/formacion-academica` — agregar formación.
- `POST /api/v1/perfil/experiencia-laboral` — agregar experiencia.
- `POST /api/v1/perfil/certificaciones` — agregar certificación.
- `GET /api/v1/perfil/:section/:id` — leer registro propio.
- `PUT /api/v1/perfil/:section/:id` — reemplazar datos del registro.
- `DELETE /api/v1/perfil/:section/:id` — eliminar registro.
- `POST /api/v1/perfil/certificaciones/:id/respaldo` — cargar/reemplazar JPG.
- `GET /api/v1/perfil/certificaciones/:id/respaldo` — leer JPG privado.
- `GET /api/v1/perfil/exportar-json` — descargar JSON del perfil.

## Autenticación

Usar `Authorization: Bearer <accessToken>` o las cookies del login. Las mutaciones con cookie requieren `X-CSRF-Token`. Lecturas: permiso `perfil:self:read`; escrituras: `perfil:self:write`.

El titulado se obtiene de `me.scopes.graduateId` y se coteja con el usuario autenticado en persistencia. No se aceptan IDs de propietario ni cabeceras de identidad. Un registro ajeno responde 404.

---

## 1. Resumen — `GET /api/v1/perfil`

**Permiso:** `perfil:self:read`. **Body:** ninguno.

**Respuesta 200**
```json
{
  "data": {
    "titulado": {
      "id": "uuid",
      "nombre": "María Pérez",
      "carrera": "Ingeniería de Sistemas",
      "promocion": null
    },
    "formacionAcademica": { "total": 0, "registros": [] },
    "experienciaLaboral": { "total": 0, "registros": [] },
    "certificaciones": { "total": 0, "registros": [] }
  }
}
```

Registros ordenados por año de egreso, fecha de inicio y año de emisión, respectivamente, del más reciente al más antiguo. En empate se usa creación e ID. Las certificaciones incluyen `respaldo: { tieneRespaldo, tipo, fechaSubida }`; nunca contienen los bytes.

**Errores:** 401 `UNAUTHENTICATED`; 403 `FORBIDDEN` o `GRADUATE_PROFILE_REQUIRED`; 404 `PROFILE_NOT_FOUND`.

## 2. Crear formación — `POST /api/v1/perfil/formacion-academica`

**Permiso:** `perfil:self:write`.

**Body**
```json
{
  "institucion": "Universidad Mayor de San Simón",
  "titulo": "Ingeniería de Sistemas",
  "grado": "Licenciatura",
  "anioEgreso": 2025
}
```

Institución y título: texto obligatorio, hasta 150 caracteres. Grado: obligatorio, hasta 50. Año: entero entre 1000 y el año actual.

**Respuesta 201:** `{ "data": { "id": "uuid", "idTitulado": "uuid", "fechaCreacion": "ISO-8601", "institucion": "...", "titulo": "...", "grado": "...", "anioEgreso": 2025 } }`.

**Errores:** 400 `VALIDATION_ERROR`; 409 `EDUCATION_EXISTS` si institución + título + año se repiten para el mismo titulado, ignorando mayúsculas y espacios de los extremos. También se impide el duplicado concurrente.

## 3. Crear experiencia — `POST /api/v1/perfil/experiencia-laboral`

**Permiso:** `perfil:self:write`.

**Body**
```json
{
  "empresa": "Empresa de ejemplo",
  "cargo": "Desarrolladora",
  "fechaInicio": "2024-01-01",
  "fechaFin": null
}
```

Empresa: obligatoria, máximo 150. Cargo: obligatorio, máximo 100. Fechas ISO `YYYY-MM-DD`, sin futuro. Fin opcional o null significa trabajo actual; no puede ser anterior al inicio.

**Respuesta 201:** registro con `id`, `idTitulado`, `fechaCreacion` y los cuatro campos anteriores. **Errores:** 400 `VALIDATION_ERROR`.

## 4. Crear certificación — `POST /api/v1/perfil/certificaciones`

**Permiso:** `perfil:self:write`.

**Body**
```json
{
  "nombre": "Curso de desarrollo web",
  "entidadEmisora": "Institución de ejemplo",
  "grado": "Curso",
  "anioEmision": 2025
}
```

Nombre y entidad: obligatorios, máximo 150. Grado: obligatorio, máximo 50. Año: entero entre 1000 y el actual.

**Respuesta 201:** registro con `id`, `idTitulado`, `fechaCreacion`, campos del body y `respaldo: { "tieneRespaldo": false, "tipo": null, "fechaSubida": null }`.

## 5. Consultar registro — `GET /api/v1/perfil/:section/:id`

**Permiso:** `perfil:self:read`. **Params:** sección `formacion-academica | experiencia-laboral | certificaciones`; ID UUID.

**Respuesta 200:** `{ "data": <registro de la sección> }`.

**Errores:** 400 `VALIDATION_ERROR` para sección/UUID inválidos; 404 `PROFILE_RECORD_NOT_FOUND` si no existe o es ajeno.

## 6. Actualizar registro — `PUT /api/v1/perfil/:section/:id`

**Permiso:** `perfil:self:write`. **Params:** los de la consulta.

**Body:** el mismo formulario completo que al crear esa sección. No acepta ID, propietario, fecha de creación ni campos de otras secciones.

**Respuesta 200:** registro actualizado dentro de `data`. Conserva ID y fecha de creación. Omitir fechaFin o enviarla como null limpia el fin anterior. Al editar formación, el registro editado no cuenta como duplicado de sí mismo.

**Errores:** 400 `VALIDATION_ERROR`; 404 `PROFILE_RECORD_NOT_FOUND`; 409 `EDUCATION_EXISTS`.

## 7. Eliminar registro — `DELETE /api/v1/perfil/:section/:id`

**Permiso:** `perfil:self:write`.

**Respuesta 204:** sin body. Al eliminar una certificación se eliminan sus metadatos de respaldo y el archivo, en la misma transacción.

**Errores:** 404 `PROFILE_RECORD_NOT_FOUND`.

## 8. Adjuntar respaldo — `POST /api/v1/perfil/certificaciones/:id/respaldo`

**Permiso:** `perfil:self:write`. **Params:** UUID de certificación propia.

**Body:** multipart/form-data con un archivo en `archivo`. Solo JPG/JPEG, firma binaria válida y hasta 5 MiB (5 242 880 bytes).

**Respuesta 201**
```json
{
  "data": {
    "id": "uuid",
    "idCertificacion": "uuid",
    "tipo": "FOTO",
    "archivoKey": "uuid",
    "fechaSubida": "ISO-8601"
  }
}
```

La referencia no es una URL pública. Reemplaza el respaldo anterior; una certificación puede existir sin respaldo.

**Errores:** 400 `BACKUP_REQUIRED` o `INVALID_IMAGE`; 404 `PROFILE_RECORD_NOT_FOUND`; 413 `PAYLOAD_TOO_LARGE`.

## 9. Leer respaldo — `GET /api/v1/perfil/certificaciones/:id/respaldo`

**Permiso:** `perfil:self:read`.

**Respuesta 200:** bytes JPG con Content-Type, Content-Length, Content-Disposition inline y Cache-Control no-store. No usa sobre JSON. En Bruno se puede enviar Bearer y guardar la respuesta. En navegador se puede usar fetch autenticado y un Blob.

**Errores:** 404 `BACKUP_NOT_FOUND`, incluido el respaldo de otro titulado.

## 10. Exportar perfil — `GET /api/v1/perfil/exportar-json`

**Permiso:** `perfil:self:read`.

**Respuesta 200:** archivo JSON con `fechaExportacion` y la estructura del resumen, sin sobre data. Nombre `perfil_<nombre_normalizado>_<YYYY-MM-DD>.json`, indentación de dos espacios. No incluye credenciales ni archivos binarios.

---

## Entidad `RegistroPerfil`

Todos los registros contienen ID UUID, idTitulado UUID y fechaCreacion ISO-8601 o null. Los demás campos dependen de la sección y están descritos en sus cuerpos de creación. Los registros nuevos tienen fecha de creación del servidor; los campos nullable de datos históricos se conservan como null.

## Casos borde

- Los permisos no conceden acceso a perfiles ajenos, ni siquiera al administrador.
- promocion permanece null porque la tabla titulado no contiene año de egreso; no se deduce de una formación arbitraria.
- Fechas laborales son días de calendario; fechas de creación y subida son instantes ISO-8601.
- Los respaldos conservan la restricción JPG del módulo anterior. No se añadió extracción NLP ni generación de PDF.
- El frontend de perfil todavía tiene datos y operaciones simulados. Esta migración implementa el backend y sus contratos; no reemplaza esos mocks.
- No se usan Supabase Auth, Storage ni conexiones SQL fuera de Prisma. Los bytes privados están en archivo_perfil, con lectura autorizada por la API.
