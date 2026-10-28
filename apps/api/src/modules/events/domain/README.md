# Dominio

entities describe un evento y sus estados. policies contiene la exigencia de BORRADOR y la relación entre las fechas. Las reglas de negocio no dependen de Nest, Prisma ni un proveedor de archivos.

El catálogo utiliza publicación y fecha de finalización; el detalle de un evento publicado puede seguir disponible después de terminar. Esa distinción conserva el comportamiento anterior y evita confundir catálogo vigente con historial consultable.
