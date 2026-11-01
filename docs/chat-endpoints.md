# Endpoints del chat

El contrato, los estados, permisos, cuerpos, paginación y pasos de despliegue están documentados en [el módulo chat](../apps/api/src/modules/chat/README.md). Todos los roles con sesión activa pueden iniciar contacto. El primer mensaje crea una solicitud y la aceptación habilita la conversación.

Las 13 peticiones manuales están en [Bruno Chat](../bruno/Chat). Completar los IDs y el token manualmente en la colección y su folder.bru. Los envíos requieren un clientId UUID nuevo por operación, que se conserva al reintentar.

Los endpoints anteriores de creación directa y respuesta simulada fueron retirados. La API y el frontend deben actualizarse juntos después de aplicar la migración 20261101000000_chat_requests. Las conversaciones históricas se conservan aceptadas.
