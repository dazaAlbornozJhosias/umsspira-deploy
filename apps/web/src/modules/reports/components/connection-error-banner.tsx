/**
 * HU-004 CA-08 y CA-09: banner único cuando reportería o encuestas no pueden
 * obtener datos del servidor. Evita la pantalla en blanco y no muestra datos.
 */
export const CONNECTION_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Verifique su conexión o intente más tarde';

export function ConnectionErrorBanner({ className = '' }: { className?: string }) {
  return (
    <p
      role="alert"
      className={`rounded-md border border-truffle-trouble bg-palladian px-4 py-3 text-sm text-abyssal-blue ${className}`}
    >
      {CONNECTION_ERROR_MESSAGE}
    </p>
  );
}
