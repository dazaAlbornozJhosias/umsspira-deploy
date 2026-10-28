# Infraestructura

repositories implementa los ports de aplicación mediante Prisma. translators convierte filas y relaciones a entidades propias; providers conecta implementaciones con casos de uso usando la inyección de Nest.

mentor-transaction centraliza el bloqueo del titulado; mentor-catalog-reader reúne las lecturas del catálogo. La validación y las escrituras relacionadas ocurren dentro de la misma transacción. El ID del mentor se resuelve mediante la relación con titulado, nunca por igualdad con el usuario.

Esta capa conoce nombres de tablas y herramientas externas. La capa application depende de sus interfaces, no de estas clases concretas.
