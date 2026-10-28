# Aplicación

Cada archivo en use-cases representa una operación. Los casos de uso derivan el alcance desde el actor verificado y delegan la persistencia al puerto ProfileRepository. contracts contiene entradas y cambios discriminados por sección; services contiene la derivación común del alcance.

El puerto expresa operaciones completas: reemplazar respaldo y eliminar certificación incluyen sus cambios asociados. Separarlas en llamadas independientes permitiría dejar metadatos sin archivo o perder la propiedad entre comprobar y escribir.
