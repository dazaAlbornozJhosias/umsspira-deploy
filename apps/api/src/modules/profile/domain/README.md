# Dominio

entities define registros académicos, laborales y de certificación con tipos explícitos. policies expresa la equivalencia usada para detectar una formación duplicada.

El dominio no importa Prisma, Nest ni contratos HTTP. La regla de duplicados se ejecuta dentro de la transacción del adaptador para conservar su garantía ante concurrencia, sin trasladar la definición de duplicado al controlador.
