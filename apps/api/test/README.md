# Pruebas del backend

`pnpm --filter api test` ejecuta las pruebas del API. `setup.ts` configura valores de prueba antes de cargar Nest; no se utilizan credenciales reales ni se prepara una base de un equipo.

`auth-flows.e2e.spec.ts` arranca una aplicación Nest durante la prueba y consume sus rutas con Supertest. Recorre login, identidad, renovación, sesiones, cierre y cambio de contraseña, además de validar CSRF, permisos actuales, expiración, propiedad y límites.

JWT, Argon2id, schemas Zod, controladores, guards, presenters y filtro de errores son los reales. Los puertos de usuarios, credenciales, sesiones y límites se sustituyen por adaptadores aislados. Esto comprueba el flujo HTTP y las decisiones de aplicación; no demuestra la ejecución de SQL, bloqueos concurrentes de PostgreSQL ni comandos Lua en un Redis real.

`adapters/` contiene el almacenamiento temporal de las pruebas. Se reinicia entre casos y comparte únicamente las definiciones de cuentas ficticias del seed. Las claves y sus hashes no se imprimen en los resultados.

`companies-job-postings.e2e.spec.ts` recorre las cuatro operaciones migradas de empresas y vacantes con los mismos guards globales de auth. Comprueba permisos separados, scopes, propiedad, UUID, CSRF, campos inmutables y validación de cuerpos. Sustituye los puertos de persistencia; no prueba transacciones reales de PostgreSQL.

`seed-demo.spec.ts` comprueba que la población de demostración requiere un destino explícito de desarrollo y rechaza producción. Ninguna prueba ejecuta migraciones ni seeds remotos. Los tests de salud y errores comprueban también que las fallas no expongan detalles internos.

## Registro documental

registrations.e2e.spec.ts comprueba las rutas Nest con sus guards, origen permitido, límites, schemas Zod y filtro de errores. Sustituye los puertos de persistencia e identidad para no tocar bases ni cuentas reales. Las pruebas del worker sustituyen SMTP y comprueban entrega, reserva entre procesos y conservación del mensaje ante fallos. Las pruebas de seguridad verifican separación de hashes y detección de alteraciones del cifrado.

La verificación manual de integración de la épica 1 recorrió PostgreSQL con registros ficticios temporales: OTP, respaldo privado, duplicados, alcance por carrera, revisiones concurrentes, dictámenes, activación y login. Sus datos se eliminaron al finalizar. El recorrido reproducible en Bruno está en docs/endpoints/epic01-grupo01-hu1.1.md; Mailpit permite leer los códigos de desarrollo sin exponerlos en las respuestas HTTP.

## Perfil y eventos

profile-events.e2e.spec.ts recorre los contratos HTTP de ambas épicas con los guards y schemas reales. Sustituye los puertos de persistencia para comprobar identidad derivada de la sesión, permisos, validación por sección, formatos de archivo, exportación JSON y rutas públicas/privadas sin tocar la base del equipo.

La comprobación de integración con PostgreSQL utilizó datos temporales para verificar duplicados académicos concurrentes, edición y borrado, respaldo privado y cascada, resumen/exportación, portadas privadas y publicadas, publicación concurrente y acceso ajeno denegado. Los datos creados para esa comprobación se eliminaron al finalizar.
