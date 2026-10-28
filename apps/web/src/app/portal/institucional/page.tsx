
import React, { Suspense } from 'react';
import Link from 'next/link';
import InstitucionalViews from './institucional-views';

const T = (tab: string) => `/portal/institucional?tab=${tab}`;

export default function PublicLandingPage() {
  return (
    <div className="bg-[#FDFBF7] text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* La barra de navegación oficial la monta el layout del portal (PortalSiteHeader) */}

      {/* Contenido según la pestaña elegida */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <InstitucionalViews />
      </Suspense>

      {/* Pie de página institucional */}
      <footer className="bg-[#0F172A] text-slate-300 py-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-base">
              UMSS · Red de Egresados
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              La red oficial de egresados de la Facultad de Ciencias y Tecnología, UMSS.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs">
                in
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs">
                𝕏
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs">
                f
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs">
                ig
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">
              Portal
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/portal/institucional" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href={T('comunidad')} className="hover:text-white transition-colors">
                  Foro
                </Link>
              </li>
              <li>
                <Link href={T('directorio')} className="hover:text-white transition-colors">
                  Directorio
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">
              Comunidad
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href={T('carreras')} className="hover:text-white transition-colors">
                  Carreras
                </Link>
              </li>
              <li>
                <Link href={T('eventos')} className="hover:text-white transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href={T('comunidad')} className="hover:text-white transition-colors">
                  Mentoría
                </Link>
              </li>
              <li>
                <Link href={T('nosotros')} className="hover:text-white transition-colors">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">
              Mantente al día
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crea tu cuenta para recibir novedades de la red.
            </p>
            <Link
              href="/register"
              className="block w-full text-center py-2.5 bg-[#FFB162] hover:bg-[#f39c4a] text-slate-900 font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Suscribirme
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>
            © 2026 Red de Egresados — Ingeniería de Sistemas, FCyT, UMSS
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href={T('nosotros')} className="hover:text-slate-400 transition-colors">
              Términos
            </Link>
            <Link href={T('nosotros')} className="hover:text-slate-400 transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
