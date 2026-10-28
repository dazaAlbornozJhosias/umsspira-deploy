# Aplicación

use-cases contiene una clase por operación. Cada caso coordina reglas y puertos; no conoce tablas, cookies, decoradores ni el transporte del correo. contracts define entradas propias de la aplicación; ports define lo que necesita de la persistencia y de la generación de secretos.

Las operaciones sensibles se expresan como métodos transaccionales del puerto: verificar un código consume un intento, enviar crea un único expediente y dictaminar guarda estado, auditoría y notificación juntos. Dividir esas garantías en varias llamadas independientes permitiría carreras y estados parciales.
