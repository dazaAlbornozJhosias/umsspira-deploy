# Aplicación

use-cases organiza una operación por archivo. contracts describe sus entradas y ports define las capacidades que necesita de persistencia y de exportación.

Los casos de uso reciben un actor ya autenticado y delegan mediante interfaces. services/report-scope valida el alcance de carreras antes de consultar. Ningún formato puede saltarse esta decisión.

Los proveedores de infraestructura conectan estos contratos con implementaciones concretas. Cambiar de adaptador no debe exigir reescribir controladores o reglas de dominio.
