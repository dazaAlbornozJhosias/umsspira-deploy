# Registro y backoffice documental

Este módulo reúne el ciclo de una solicitud de ingreso: borrador, verificación de correo, respaldo, envío y dictamen. Son partes del mismo proceso y necesitan confirmar cambios de manera atómica. La cuenta y sus sesiones pertenecen a auth/user; aquí solo se conecta la aprobación con la creación de la credencial propia al activar.

## Cómo recorrerlo

Cada ruta tiene un controlador y cada operación un caso de uso. Nest registra las rutas mediante decoradores y la lista de controllers de registrations.module.ts. El prefijo global agrega /api/v1. No se registra un router Express paralelo: introducirlo permitiría omitir guards y validación de Nest.

El controlador valida el contrato de entrada con Zod, obtiene la identidad verificada cuando corresponde y llama al caso de uso. Las reglas no dependen de decoradores, Prisma, Redis ni SMTP. Los providers unen contratos y adaptadores. El repositorio ejecuta las transacciones y traduce filas; no decide quién es el actor a partir de cabeceras.

## Persistencia y privacidad

Los borradores tienen dos horas de vigencia y se almacenan en PostgreSQL para sobrevivir al reinicio de la API. Su token UUID se conserva únicamente como HMAC. El JSON del formulario tiene datos temporales validados por el servidor; las solicitudes definitivas usan detalle_solicitud, solicitud y documento_respaldo.

Los archivos privados se guardan como bytea con un máximo de 5 MiB. Esta decisión permite ejecutar la entrega académica sin añadir un servicio de objetos ni depender del disco efímero del despliegue. El archivo no se carga al listar expedientes: esas consultas seleccionan solo sus metadatos. Si el volumen exige otro almacenamiento, se modifica el adaptador y el esquema mediante una migración; la política de acceso debe permanecer en el backend.

Dictaminar toma un bloqueo de fila y guarda el estado, la auditoría y el correo en la misma transacción. Así no hay dos decisiones válidas concurrentes ni una aprobación confirmada sin notificación pendiente. Los intentos incorrectos de códigos se confirman antes de devolver un error, para que un rollback no borre el contador.

## Acceso

Las rutas de backoffice usan los guards compartidos, permisos explícitos y carreras del actor. El permiso concede una operación; el alcance determina sobre qué expedientes puede ejecutarla. También se comprueba el alcance al leer los bytes. Nunca se debe confiar en un UUID aportado por el cliente como prueba de propiedad.

Las rutas públicas usan PublicRegistration, que aplica origen y límites de tráfico además de declararlas públicas. Ese decorador es propio de este flujo, no una forma de desactivar la seguridad de otros módulos.

## Correo

SMTP funciona detrás de un worker y una cola persistida. El worker consulta cada cinco segundos, reserva cada mensaje durante un minuto y reintenta fallos. El contenido se cifra con AES-256-GCM; se elimina después de entregar. Se reutiliza una clave derivada por propósito de AUTH_JWT_SECRET: cambiar esa clave invalida los tokens, códigos y correos pendientes de ese entorno.

En desarrollo: `docker compose up -d mailpit`. Abrir http://localhost:8025 para leer los mensajes y sus códigos. No hace falta modificar el .env: SMTP usa smtp://127.0.0.1:1025 y un remitente local. Al publicar, configurar SMTP_URL y MAIL_FROM con un servidor y remitente autorizados. Mailpit recibe correos localmente, no los entrega a Internet.

Ver los [contratos HTTP](../../../docs/endpoints/epic01-grupo01-hu1.1.md) para probar el flujo en Bruno.
