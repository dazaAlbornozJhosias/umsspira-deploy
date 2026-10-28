# Dominio

entities contiene los registros, estados e indicadores del reporte con tipos propios. policies expresa las etiquetas y el cálculo de duración de estudios.

Esta capa no importa Nest, Prisma ni Express. Una fila de PostgreSQL se convierte a estos tipos en infrastructure/translators; el contrato HTTP se construye por separado en http/presenters.
