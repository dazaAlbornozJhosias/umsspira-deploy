'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from './register-sw';

export default function ServiceWorkerRegister() {
  const [apply, setApply] = useState<(() => void) | null>(null);

  useEffect(() => {
    registerServiceWorker((applyUpdate) => setApply(() => applyUpdate));
  }, []);

  if (!apply) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 text-white shadow-lg"
    >
      <span className="text-sm">Hay una versión nueva disponible.</span>
      <button
        onClick={apply}
        className="min-h-[44px] rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-900"
      >
        Actualizar
      </button>
    </div>
  );
}