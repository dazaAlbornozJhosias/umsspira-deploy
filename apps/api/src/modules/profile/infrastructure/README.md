# Infraestructura

repositories implementa el puerto con Prisma. Todas las consultas de registros propios incluyen el ID de titulado y la relación con el usuario de la sesión. Las mutaciones toman el bloqueo del perfil antes de modificar sus filas; no se depende de que el frontend oculte los IDs ajenos.

translators transforma filas de Prisma sin exportar tipos generados fuera del adaptador. providers une los casos de uso con el repositorio en Nest. El respaldo JPG vive en archivo_perfil, relacionado con certificacion_respaldo; los bytes no se cargan al construir el resumen.
