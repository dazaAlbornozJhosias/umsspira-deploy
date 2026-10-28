# Dominio

entities contiene el perfil, las áreas, los intereses y la disponibilidad del mentor con tipos propios. policies expresa cuándo un mentor puede recibir solicitudes y qué constituye una selección repetida.

Esta capa no importa Nest, Prisma ni Express. Una fila de PostgreSQL se convierte a estos tipos en infrastructure/translators; el contrato HTTP se construye por separado en http/presenters.
