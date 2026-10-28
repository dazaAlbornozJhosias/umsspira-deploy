# Aplicación

use-cases organiza una operación por archivo. contracts describe sus entradas y ports define las capacidades que necesita de persistencia.

Los casos de uso reciben un actor ya autenticado y delegan mediante interfaces. La identidad propia siempre proviene de actor.id. El caso de desactivación pasa las carreras autorizadas al repositorio.

Los proveedores de infraestructura conectan estos contratos con implementaciones concretas. Cambiar de adaptador no debe exigir reescribir controladores o reglas de dominio.
