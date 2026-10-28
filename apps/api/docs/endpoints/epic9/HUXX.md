# [epicXX-grupoXX-huXXX] [Nombre de la HU]

**Épica:** Portal admin base · **Prefijo:** `/api/v1/reports`
**Éxito:** `{ "data": ... }`; CSV/PDF devuelven bytes descargables.
**Error:** `{ "error": { "code": "CODIGO", "message": "..." } }`; validación agrega `fields`.

## Endpoints

- `GET /api/v1/reports/metrics` — indicadores institucionales.
- `GET /api/v1/reports/graduates` — listado paginado.
- `GET /api/v1/reports/graduates/report` — datos completos para vista previa.
- `GET /api/v1/reports/graduates/csv` — descargar CSV.
- `GET /api/v1/reports/graduates/pdf` — descargar PDF.

## Autenticación

Todas las rutas requieren `reportes:read` y carreras asignadas al usuario autenticado. Usar Bearer del login o cookies de sesión. Ningún header de usuario, rol o carrera sustituye esa autenticación.

`careerId` restringe la consulta a una carrera asignada; si se omite, incluye todas las asignadas. No tener asignaciones o elegir una carrera ajena devuelve 403 `REPORT_CAREER_FORBIDDEN`.

Errores comunes: 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 400 `VALIDATION_ERROR`. Las queries son estrictas: parámetros desconocidos producen 400.

---

## 1. Indicadores — `GET /api/v1/reports/metrics`

**Permiso:** `reportes:read`.
**Query:** `careerId` UUID opcional. **Body:** ninguno.

**Respuesta 200**

```json
{
  "data": {
    "totalGraduates": 30,
    "verifiedGraduates": 20,
    "observedGraduates": 3,
    "activeMentors": 5
  }
}
```

- `totalGraduates`: número de solicitudes, incluyendo todos sus estados.
- `verifiedGraduates`: solicitudes APROBADA.
- `observedGraduates`: solicitudes OBSERVADA.
- `activeMentors`: perfiles de mentor activos de titulados con cuentas activas de las carreras autorizadas.

Se conservan los nombres de los indicadores del cliente anterior. Los tres primeros cuentan solicitudes, no personas únicas. `activeMentors` no usa la intención de ser mentor del formulario y no cambia al pausar disponibilidad.

**Errores:** 403 `REPORT_CAREER_FORBIDDEN`. Una carrera sin registros devuelve ceros.

## 2. Listado — `GET /api/v1/reports/graduates`

**Permiso:** `reportes:read`.

**Query**

| Parámetro | Tipo y regla                                     |
| --------- | ------------------------------------------------ |
| careerId  | UUID opcional, asignado al actor                 |
| status    | PENDIENTE, APROBADA, OBSERVADA o RECHAZADA; opcional |
| search    | Texto opcional, máximo 100 caracteres            |
| page      | Entero desde 1 hasta 100000; predeterminado 1    |
| limit     | Entero desde 1 hasta 1000; predeterminado 10     |

`search` busca parcialmente en nombre, apellido, email, CI y SIS. Ignora mayúsculas en nombres y correo. El SIS se busca cuando el término solo tiene dígitos. Sin status se incluyen todos los estados.

**Respuesta 200**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid-de-solicitud",
        "idCarrera": "uuid",
        "carrera": "Ingeniería de Sistemas",
        "nombre": "María",
        "apellido": "Pérez",
        "telefono": "70000000",
        "email": "maria@ejemplo.org",
        "fechaTitulacion": "2025-05-01",
        "fechaIngreso": "2020-02-01",
        "ci": "1234567",
        "extensionCi": "",
        "expedidoEn": "CB",
        "anioEgreso": null,
        "codSis": "202012345",
        "deseaMentor": true,
        "estado": "APROBADA",
        "fechaCreacion": "2026-10-18T12:00:00.000Z",
        "fechaRevision": "2026-10-18T13:00:00.000Z",
        "justificacion": null
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Orden por creación descendente y UUID ascendente. Una página fuera de rango o sin coincidencias devuelve items vacío, conservando total. Las fechas y el año faltantes son null; no se inventan departamentos, años ni fechas.

**Errores:** 400 `VALIDATION_ERROR`; 403 `REPORT_CAREER_FORBIDDEN`.

## 3. Vista previa — `GET /api/v1/reports/graduates/report`

**Permiso:** `reportes:read`.
**Query:** careerId, status y search con las reglas del listado. No admite page ni limit.

**Respuesta 200**

```json
{
  "data": {
    "careerNames": ["Ingeniería de Sistemas"],
    "status": "APROBADA",
    "total": 1,
    "generatedAt": "2026-10-18T14:00:00.000Z",
    "graduates": [
      {
        "number": 1,
        "id": "uuid-de-solicitud",
        "fullName": "Pérez, María",
        "career": "Ingeniería de Sistemas",
        "sisCode": "202012345",
        "phone": "70000000",
        "email": "maria@ejemplo.org",
        "admissionDate": "01/02/2020",
        "graduationDate": "01/05/2025",
        "careerDuration": "5 años, 3 meses",
        "statusDate": "18/10/2026",
        "status": "APROBADA",
        "statusLabel": "Aprobado",
        "justification": null
      }
    ]
  }
}
```

`careerNames` enumera las carreras del alcance solicitado. Sin filtro de estado, status es null. La fecha de revisión y la justificación provienen del último dictamen. Fechas o duración desconocidas se presentan como `No disponible`.

**Errores:** 404 `REPORT_EMPTY` si no hay coincidencias; 400 `REPORT_TOO_LARGE` si se superan 10000 registros; 403 `REPORT_CAREER_FORBIDDEN`.

## 4. Descargar CSV — `GET /api/v1/reports/graduates/csv`

**Permiso:** `reportes:read`.
**Query:** careerId, status y search. No admite paginación.

**Respuesta 200:** bytes CSV, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`, nombre `nomina-egresados-<estado|todos>-AAAA-MM-DD.csv`.

Columnas: Nro, Número de registro, Nombre completo, Carrera, Código SIS, Teléfono, Correo electrónico, Fecha de ingreso, Fecha de titulación, Duración de estudio, Fecha de revisión, Observación o rechazo y Estado.

Incluye BOM UTF-8, separador coma, celdas entre comillas y líneas CRLF. Escapa comillas internas. Un apóstrofo evita que contenido aportado por usuarios se interprete como fórmula de una hoja de cálculo.

**Errores:** 404 `REPORT_EMPTY`; 400 `REPORT_TOO_LARGE`; 403 `REPORT_CAREER_FORBIDDEN`; 429 `RATE_LIMITED` con Retry-After.

## 5. Descargar PDF — `GET /api/v1/reports/graduates/pdf`

**Permiso:** `reportes:read`.
**Query:** careerId, status y search. No admite paginación.

**Respuesta 200:** bytes PDF, `Content-Type: application/pdf`, `Content-Disposition: attachment`, nombre `reporte-titulados-<estado|todos>-AAAA-MM-DD.pdf`.

A4 horizontal con escudo y encabezado institucional, carreras, filtro, total y fecha de generación. Tabla de nombre/carrera, SIS, teléfono, correo, ingreso, titulación, duración, revisión y estado. Las justificaciones se muestran debajo del registro. Repite encabezados y numera páginas.

**Errores:** iguales al CSV. Ambas descargas comparten un límite de cinco por minuto y por usuario mediante el limitador existente de auth.

---

## Entidad `Registro de reporte`

El UUID representa una solicitud documental, no un usuario ni un titulado. El listado contiene datos originales y fechas ISO; la vista previa y los archivos convierten fechas a DD/MM/AAAA, calculan meses completos de duración y traducen estados a español.

## Casos borde

- Cada consulta aplica carreras autorizadas y los mismos filtros en persistencia; no hay fallback a fixtures.
- APROBADA y RECHAZADA permiten exportar aprobados y rechazados. PENDIENTE y OBSERVADA conservan la consulta de otros estados existentes.
- Sin resultados, el listado devuelve 200 vacío; vista previa y archivos devuelven 404 REPORT_EMPTY.
- Una página usa una instantánea consistente para filas y total. La vista previa y una descarga posterior son peticiones independientes y pueden reflejar cambios nuevos.
- El máximo de exportación es 10000 registros. El archivo se genera en memoria y no queda guardado como un reporte histórico.
- La seed de demostración incluye cuatro solicitudes ficticias con distintos estados y un mentor activo para probar indicadores, listados y exportaciones.
- Se estandarizaron las rutas antiguas metrics/indicators/dashboard en metrics. No se agregan rutas duplicadas con segmentos de rol.
- El frontend conserva sus URLs y adaptadores anteriores; su integración con estas rutas y el sobre data queda pendiente.
