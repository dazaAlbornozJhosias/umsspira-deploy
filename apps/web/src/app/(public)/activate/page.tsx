import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ActivateView } from './activate-view';

export const metadata: Metadata = {
  title: 'Activar Cuenta de Titulado • UMSSPIRA',
  description: 'Proceso oficial de activación de cuenta institucional para titulados de la UMSS.',
};

export default function ActivatePage() {
  return (
    <main className="min-h-screen bg-[#F2EDE3] flex flex-col">
      {/* Encabezado Institucional */}
      <header className="w-full flex items-center justify-between bg-[#101827] px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Image
            src="/icons/icon-192.png"
            alt="Logo UMSSPIRA"
            width={38}
            height={38}
            className="h-10 w-10 object-contain"
            priority
          />
          <div className="leading-tight">
            <span className="text-2xl font-black tracking-tight text-white">
              UMSS<span className="text-burning-flame">PIRA</span>
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-white/70">
              UNIVERSIDAD MAYOR DE SAN SIMÓN
            </span>
          </div>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-oatmeal/80 bg-white/80 px-3 py-1 text-xs font-semibold text-abyssal-blue/80 shadow-sm backdrop-blur">
          Portal Seguro
        </span>
      </header>

      {/* Contenido Dinámico con Suspense */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="flex w-full max-w-xl items-center justify-center rounded-2xl border border-oatmeal/60 bg-white p-12 text-center text-sm font-medium text-abyssal-blue/70 shadow-sm">
              Cargando portal de activación...
            </div>
          }
        >
          <ActivateView />
        </Suspense>
      </div>

      {/* Pie de página institucional */}
      <footer className="mx-auto w-full max-w-3xl pb-8 text-center text-[11px] text-abyssal-blue/60 space-y-1">
        <p className="uppercase tracking-wider font-medium">
          UNIVERSIDAD MAYOR DE SAN SIMÓN • DTI & DPA
        </p>
        <p>Facultad de Ciencias y Tecnología • Plataforma Oficial de Titulados</p>
      </footer>
    </main>
  );
}
