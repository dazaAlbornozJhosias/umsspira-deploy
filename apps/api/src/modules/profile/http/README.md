# HTTP

Un controlador por operación mantiene visibles su método, ruta, permiso y contrato de entrada. Todos los schemas Zod están en schemas/profile.schemas.ts. La edición utiliza la sección validada para elegir un contrato discriminado; nunca utiliza un nombre de tabla enviado por el cliente.

presenters adapta el dominio al JSON esperado por las pantallas. El resumen usa el sobre data; la exportación devuelve un archivo JSON y el respaldo devuelve bytes. La validación y los errores de negocio se traducen mediante el filtro compartido.
