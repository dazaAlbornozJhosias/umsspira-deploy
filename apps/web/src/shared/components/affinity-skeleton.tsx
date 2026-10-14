'use client';

import React from 'react';

/**
 * Marcador de carga de la vista de afinidad.
 *
 * Reproduce la retícula de dos tarjetas (gráfico y resumen) para que la
 * estructura no salte cuando lleguen los datos. Los bloques usan el mismo
 * ritmo de opacidad en todos los elementos para que la lectura sea suave.
 */
export const AffinitySkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Cargando tu radar de afinidad"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-oatmeal">
          <div className="flex items-center justify-between border-b border-palladian pb-4 mb-4">
            <div className="h-4 w-40 rounded bg-palladian animate-pulse" />
            <div className="h-6 w-36 rounded-md bg-palladian animate-pulse" />
          </div>

          <div className="py-4 flex items-center justify-center bg-palladian/40 rounded-xl border border-oatmeal/60">
            <div className="h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-palladian animate-pulse" />
          </div>

          <div className="pt-6 border-t border-palladian mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-3 w-full sm:w-64 rounded bg-palladian animate-pulse" />
            <div className="flex items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="h-11 flex-1 sm:flex-none sm:w-40 rounded-lg bg-palladian animate-pulse" />
              <div className="h-11 flex-1 sm:flex-none sm:w-32 rounded-lg bg-palladian animate-pulse" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-oatmeal">
          <div className="flex items-center justify-between border-b border-palladian pb-4">
            <div className="h-4 w-44 rounded bg-palladian animate-pulse" />
            <div className="h-6 w-24 rounded-full bg-palladian animate-pulse" />
          </div>

          <div className="mt-5 h-3 w-full rounded bg-palladian animate-pulse" />

          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-palladian/50 border border-oatmeal/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-palladian animate-pulse" />
                  <div className="h-3 w-32 sm:w-40 rounded bg-palladian animate-pulse" />
                </div>
                <div className="h-3 w-10 rounded bg-palladian animate-pulse" />
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-palladian/70 border border-oatmeal/70">
            <div className="h-3 w-full rounded bg-palladian animate-pulse" />
            <div className="mt-2 h-3 w-4/5 rounded bg-palladian animate-pulse" />
          </div>

          <div className="pt-6">
            <div className="w-full h-11 rounded-lg bg-palladian animate-pulse" />
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-blue-fantastic">
        Leyendo tu radar de afinidad...
      </p>
    </div>
  );
};
