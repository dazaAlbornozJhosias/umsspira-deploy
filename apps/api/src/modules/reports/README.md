# Reportería institucional

Proporciona indicadores, listado paginado, vista previa y exportaciones CSV/PDF. Utiliza solicitudes y dictámenes reales; una consulta vacía o un error de PostgreSQL nunca activa datos simulados.

## Alcance de los datos

El permiso reportes:read autoriza la operación. reportScope restringe cada consulta a las carreras asignadas al actor autenticado. El filtro careerId puede reducir ese alcance; no puede ampliarlo. Sin asignaciones se devuelve 403.

El repositorio centraliza filtros para listado, vista previa y ambos archivos. Usa transacciones RepeatableRead para que una página y su total correspondan al mismo estado de los datos. Cada descarga es una consulta nueva: cambios posteriores pueden alterar sus resultados.

Los indicadores históricos totalGraduates, verifiedGraduates y observedGraduates cuentan solicitudes, aprobaciones y observaciones. activeMentors cuenta perfiles activos de titulados con cuentas activas; no usa desea_mentor ni el estado de disponibilidad.

## Exportaciones

application define un port de escritura; CSV y PDF son adaptadores en infrastructure/exporters. El caso de uso obtiene los datos autorizados y el adaptador decide el formato. El controlador configura únicamente la respuesta HTTP.

CSV incluye BOM UTF-8, escapa celdas y neutraliza fórmulas. PDF incorpora el escudo local y repite el encabezado de tabla al paginar. No descarga imágenes ni fuentes durante la petición.

Cada archivo admite hasta 10000 registros y cada usuario hasta cinco descargas por minuto mediante el limitador compartido de auth. No se agrega una dependencia obligatoria de Redis. Los bytes se producen en memoria y no se almacenan como reportes históricos.

Los [contratos HTTP](../../../docs/endpoints/epic09-grupo09-hu1.9.md) describen filtros, errores y formatos. No se modificó el frontend.
