# Aplicación de autenticación

`use-cases/` contiene una operación por archivo, con el nombre de la acción y el sufijo `.use-case.ts`. Su método `execute` representa la entrada de esa operación. Los controladores y guards llaman a estos casos de uso.

`ports/` contiene un contrato por dependencia externa: credenciales, sesiones, contraseñas, tokens y límites. La aplicación pide capacidades, no clientes de bases de datos. Los símbolos identifican estos contratos al componerlos con Nest.

`contracts/` reúne entradas, salidas y opciones compartidas entre operaciones. `services/` contiene coordinación reutilizada por varios casos de uso, como emitir tokens o recuperar una sesión verificada. No es una carpeta para concentrar nuevamente todas las operaciones en un servicio.

Los constructores reciben los puertos necesarios. No utilizan decoradores de Nest ni consultan variables de entorno; la composición transforma la configuración y entrega las dependencias desde infraestructura.
