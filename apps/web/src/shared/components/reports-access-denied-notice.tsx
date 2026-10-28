'use client';

import { useEffect, useState } from 'react';

/** Se muestra al titulado que fue redirigido desde una ruta administrativa. */
export function ReportsAccessDeniedNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setShow(
      window.location.pathname === '/portal' &&
      search.get('acceso') === 'reportes-no-autorizado',
    );
  }, []);

  if (!show) return null;

  return (
    <p
      role="alert"
      className="mx-auto mt-4 max-w-7xl rounded-lg border border-truffle-trouble bg-white px-5 py-3 text-sm font-medium text-abyssal-blue"
    >
      Acceso no autorizado: requiere rol de Administrador de Carrera
    </p>
  );
}
