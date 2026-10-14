'use client';

import { pdfjs } from 'react-pdf';

// pdf.js necesita Promise.withResolvers, que no existe en Safari anterior a 17.4
// ni en Chrome anterior a 119. Se agrega sólo si el navegador no lo trae.
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((onResolve, onReject) => {
      resolve = onResolve;
      reject = onReject;
    });
    return { promise, resolve, reject };
  };
}

// Proceso aparte del navegador que lee el PDF sin bloquear la pantalla.
// Se carga desde el CDN con la misma versión de pdfjs que trae react-pdf: Next.js 14 no puede
// minificar pdf.worker.min.mjs al compilar para producción si se empaqueta con la aplicación.
// Se usa la variante «legacy», que también funciona en navegadores anteriores.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

export { pdfjs };
