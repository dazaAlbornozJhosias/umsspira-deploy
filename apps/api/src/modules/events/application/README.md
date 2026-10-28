# Aplicación

Los casos de uso coordinan lectura pública, gestión del creador y portadas mediante EventsRepository. contracts describe el formulario de evento, con coverId interno en lugar de una URL arbitraria del cliente.

Publicar y actualizar se expresan como operaciones transaccionales del puerto. El adaptador comprueba de nuevo propietario y estado mientras mantiene el bloqueo de fila. La identidad se recibe del actor verificado; no hay un parámetro userId que el cliente pueda usar para actuar por otro usuario.
