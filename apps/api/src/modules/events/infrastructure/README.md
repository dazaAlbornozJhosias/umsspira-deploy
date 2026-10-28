# Infraestructura

repositories habla con Prisma y mantiene las transacciones de eventos y portadas. El estado se persiste en mayúsculas. La relación id_portada permite comprobar existencia, propietario y uso, sin interpretar URLs externas ni llamar a Storage.

El catálogo filtra en PostgreSQL y selecciona solo los datos del evento y el nombre del creador. Los bytes de portada se recuperan únicamente en su lectura. Los bloqueos de fila impiden publicar dos veces un borrador o eliminar una portada mientras se vincula.

translators convierte filas al dominio y providers configura las dependencias de Nest. No se exporta Prisma al controlador ni al caso de uso.
