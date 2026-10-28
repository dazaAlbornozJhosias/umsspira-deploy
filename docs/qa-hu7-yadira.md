# HU-07: edición, reverificación y vista previa

Alcance: T-07.1, T-07.2 y conservación de BUG-06. Sin cambios de HU-11 ni de la idempotencia de entrega de T-07.3.

## Contratos

- `PATCH /api/v1/registrations/sessions/:token`: recibe los mismos campos que el registro inicial. Valida carrera, duplicados y vigencia, guarda el borrador y devuelve `{ data: { verifiedEmail } }`. Un correo diferente invalida el OTP y la verificación actual. El último correo verificado se conserva como metadata interna del JSON del borrador para permitir cancelar el cambio; el schema público rechaza esa propiedad.
- `POST /api/v1/email-verification/resend` y `/verify`: aceptan `email` opcional además del contrato anterior. El frontend lo envía para impedir que una pestaña antigua verifique una dirección diferente de la que muestra. El servidor elige siempre el destinatario desde el borrador.
- `GET /api/v1/registrations/sessions/:token/document`: devuelve el documento del borrador vigente, sin caché. El frontend crea y libera una URL blob propia; no reutiliza la que destruye el paso de carga.

No se necesitan migraciones ni cambiar tablas manualmente. Reiniciar el backend y el frontend para cargar las nuevas rutas.

## Prueba local

1. Configurar `apps/api/.env` con las conexiones de la BD de pruebas, `APP_ENV=epic`, `NODE_ENV=development` y `AUTH_JWT_SECRET`. Configurar `apps/web/.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3000`.
2. Si faltan migraciones/datos de demostración, ejecutar desde la raíz `pnpm --filter api db:deploy` y `pnpm --filter api db:seed:demo`. No resetear una BD con datos útiles. Estos comandos usan la conexión configurada, no la rama Git.
3. Ejecutar `docker compose up -d mailpit`. Iniciar `pnpm --filter api dev` y `pnpm --filter web dev` en terminales distintas.
4. Abrir `http://localhost:3001/register` con una identidad ficticia nueva. Verificar el primer correo con el OTP recibido en `http://localhost:8025`.
5. Subir PDF, llegar a `/register/review` y comprobar la vista previa. Recargar: debe recuperarse. Repetir con PNG/JPG.
6. Editar nombre y teléfono, guardar y revisar en Network que el PATCH responde 200. En Supabase, `borrador_registro.datos` debe contener los valores nuevos. Aún no se ha creado una solicitud definitiva.
7. Cambiar el correo A por B. El PATCH debe responder 200; el reenvío debe dirigirse a B. El código de A no debe validar B. Con un OTP incorrecto, no debe habilitarse la entrega. Con el OTP de B, regresar al resumen conservando el archivo y los datos.
8. En otro borrador, cambiar A por B, volver al resumen sin verificar y pulsar «Usar el correo anterior». Debe recuperar A verificado también en servidor.
9. Volver al documento y conservarlo sin subirlo otra vez. Reemplazarlo por uno válido; probar archivo inválido y mayor de 5 MB.
10. Entregar y consultar `detalle_solicitud`: nombre, teléfono y correo deben coincidir con el resumen. Abrir el expediente en `/applications` y comprobarlos también allí.
11. La confirmación pública no debe mostrar TIT ni N/A; el drawer administrativo conserva TIT.
12. Detener temporalmente la API durante «Guardar cambios»: debe mostrar error y conservar la edición, sin anunciar éxito ni permitir entregar datos sin guardar.

Las pruebas automatizadas sustituyen PostgreSQL/SMTP con adaptadores o mocks. La comprobación real de la BD y recepción del correo se realiza con el recorrido anterior. Mailpit recibe mensajes de desarrollo; no los entrega a casillas de Internet. Para correo real se configura SMTP_URL.

## Publicación de esta corrección

Los cambios se distribuyen en tres ramas encadenadas:

1. `feat/G8-HU7-reviewSummaryPage`: T-07.1, resumen y vista previa, cancelación de reemplazo y botones.
2. `feat/G8-HU7-inlineEditReverify`: T-07.2, persistencia de edición y reverificación. Incluye la rama anterior como dependencia.
3. `feat/G8-BUG6-internalCodeVisibility`: BUG-06, confirmación pública sin TIT/N/A y código conservado en administración. Incluye las dos anteriores.

Crear los PR con base `epic1` e integrarlos en ese orden. Mientras los primeros no estén integrados, los PR posteriores mostrarán también sus cambios heredados. No incluir HU-11. La rama `epic1` no se modifica al publicar estas ramas. El historial propio es lineal y los commits no superan 250 líneas modificadas. Para sincronizar se usa rebase; no se incorpora epic1 mediante un merge inverso. Si cambia la base de T-07.1, se deben reajustar también sus dos ramas dependientes antes de publicar.

Título sugerido: `fix: completar edicion y reverificacion del resumen HU-07`.

Descripción: «Persiste la edición del resumen en el borrador antes de entregar, invalida y reverifica el correo cuando cambia, recupera la vista previa tras navegar o recargar y ajusta el encabezado al diseño. Conserva el documento y el correo previamente verificado al cancelar. Mantiene TIT solo en administración. No modifica HU-11 ni la idempotencia de T-07.3. No requiere migraciones».


## Ajustes del paso de documentos y botones

- Al cambiar el documento, «Cancelar y conservar documento anterior» permanece visible aun después de seleccionar otro archivo. Sale al resumen sin subir el reemplazo ni cambiar el documento guardado; se bloquea solamente durante una carga ya iniciada.
- «Finalizar solicitud» permanece deshabilitado hasta tener tipo, archivo válido (o el archivo guardado sin cambiar su tipo) y declaración aceptada. Un mensaje junto al botón enumera lo pendiente.
- Los botones principales de registro, OTP, edición, revisión y confirmación usan estilos locales con fondo naranja y texto oscuro también al pasar el cursor. Comprobar con ratón y foco de teclado.
