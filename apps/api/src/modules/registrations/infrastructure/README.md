# Infraestructura

repositories conoce Prisma y los bloqueos de PostgreSQL. translators convierte filas a entidades o resultados de aplicación; no devuelve filas completas por comodidad. providers conecta interfaces con adaptadores dentro de Nest.

security implementa UUID, códigos aleatorios, HMAC y cifrado autenticado. notifications implementa SMTP y la entrega de la cola: un fallo de red puede retrasar un correo sin deshacer un dictamen confirmado. La reserva impide que dos workers tomen el mismo correo simultáneamente; una caída después de entregar pero antes de confirmar puede ocasionar una entrega repetida.

Las consultas del backoffice filtran por las carreras del actor. El listado pagina en PostgreSQL y selecciona metadatos del archivo; su contenido solo se recupera en la operación de lectura autorizada.
