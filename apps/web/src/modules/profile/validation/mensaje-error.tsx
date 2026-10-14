import { AlertCircle } from 'lucide-react';

// Estilo de error del mockup "perfil egresado con errores": borde terracota y fondo rosado
export const CAMPO_ERROR_CLASE = '!border-truffle-trouble !bg-[#FDECEA]';

export function claseCampo(base: string, error?: string): string {
  return error ? `${base} ${CAMPO_ERROR_CLASE}` : base;
}

// Mensaje de error debajo del campo, con el ícono "!" del mockup
export function MensajeError({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} role="alert" className="mt-1 flex items-center gap-1 text-xs text-truffle-trouble">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}
