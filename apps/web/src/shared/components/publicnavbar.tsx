'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import logoUmss from '@/shared/assets/images/logoumsspira.jpg';

const BASE = '/portal/institucional';

// Un solo registro de pestañas para escritorio y móvil.
// tab = null es la portada (Inicio).
const navItems: { name: string; tab: string | null }[] = [
  { name: 'Inicio', tab: null },
  { name: 'Comunidad', tab: 'comunidad' },
  { name: 'Directorio', tab: 'directorio' },
  { name: 'Carreras', tab: 'carreras' },
  { name: 'Eventos', tab: 'eventos' },
  { name: 'Sobre nosotros', tab: 'nosotros' },
];

const hrefOf = (tab: string | null) => (tab ? `${BASE}?tab=${tab}` : BASE);

export default function PublicNavbar() {
  const pathname = (usePathname() ?? '').replace(/\/$/, '');
  const currentTab = useSearchParams().get('tab');
  const [open, setOpen] = useState(false);

  // Estado activo según la URL
  const isActive = (tab: string | null) =>
    pathname === BASE && (currentTab ?? null) === tab;

  // Cierra con la tecla Esc y bloquea el scroll mientras el panel está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="w-full bg-[#0F172A] text-white border-b border-slate-800 shadow-md font-sans relative z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo y facultad */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link href="/portal" className="relative block w-28 sm:w-40 h-14 sm:h-16" aria-label="Ir al portal">
            <Image
              src={logoUmss}
              alt="Logo UMSSPIRA"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
          <div className="hidden xl:block border-l border-slate-700 pl-3 text-[11px] text-slate-300 font-medium leading-tight">
            <span className="block font-bold text-white">UMSS - FCYT</span>
            <span className="block">INGENIERÍA INFORMÁTICA</span>
            <span className="block">INGENIERÍA DE SISTEMAS</span>
          </div>
        </div>

        {/* Menú escritorio */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 font-medium">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={hrefOf(item.tab)}
              aria-current={isActive(item.tab) ? 'page' : undefined}
              className={`flex items-center whitespace-nowrap px-3 lg:px-3.5 py-2 text-sm lg:text-[15px] rounded-xl transition-all relative ${
                isActive(item.tab)
                  ? 'bg-[#1E293B] text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{item.name}</span>
              {isActive(item.tab) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB162] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Acciones: siempre visibles en la barra (escritorio y móvil) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="whitespace-nowrap px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white border border-slate-600 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="whitespace-nowrap px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-[#FFB162] hover:bg-[#f39c4a] rounded-xl transition-colors shadow-sm"
          >
            Registro
          </Link>

          {/* Botón que abre el panel lateral (solo móvil) */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="panel-lateral-movil"
            className="md:hidden p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Fondo oscuro: al tocarlo se cierra el panel */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel lateral derecho: solo las opciones del menú */}
      <aside
        id="panel-lateral-movil"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-[#0F172A] border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabecera del panel */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <span className="text-sm font-bold uppercase tracking-wider text-amber-400">Menú</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Opciones en una sola columna */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={hrefOf(item.tab)}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.tab) ? 'page' : undefined}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.tab)
                  ? 'bg-[#1E293B] text-white border-l-2 border-[#FFB162]'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
    </header>
  );
}