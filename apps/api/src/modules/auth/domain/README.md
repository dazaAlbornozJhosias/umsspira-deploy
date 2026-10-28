# Dominio de autenticación

`entities/` contiene las estructuras que representan conceptos de autenticación; `policies/` expresa reglas puras sobre esos conceptos. Cada archivo tiene un nombre que describe su responsabilidad.

Una entidad de dominio no es un modelo generado por Prisma. `AuthSession` utiliza nombres del negocio y tipos propios de TypeScript. El esquema de almacenamiento se define en `prisma/schema.prisma` y el translator convierte sus registros a esta entidad.

El dominio no importa Nest, Prisma, Express ni clases de aplicación. Así sus reglas se pueden entender y probar sin servidor ni base de datos. No se agregan carpetas vacías para simular responsabilidades que todavía no existen.
