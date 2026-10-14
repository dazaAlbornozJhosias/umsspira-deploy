'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Briefcase, Star, Users, User, Bell, ChevronDown, Award, Menu, X, LogOut } from 'lucide-react';

// Importamos la imagen usando la ruta correcta desde shared/assets
import logoUmss from '@/shared/assets/images/logoumsspira.jpg';

const navItems = [
  { href: '/portal', label: 'Inicio', Icon: Home, exact: true },
  { href: '/portal/eventos', label: 'Eventos', Icon: Calendar },
  { href: '/portal/empleos', label: 'Bolsa de trabajo', Icon: Briefcase },
  { href: '/portal/mentorias', label: 'Mentorías', Icon: Award },
  { href: '/portal/beneficios', label: 'Beneficios', Icon: Star },
  { href: '/portal/comunidad', label: 'Comunidad', Icon: Users },
];

export const Navbar: React.FC = () => {
  // =====================================================================
  // 🎛️ PANEL DE CONTROL DE TAMAÑOS Y DISPOSICIÓN INDEPENDIENTE
  // =====================================================================
  const config = {
    height: "h-16 lg:h-20",
    logoWidth: "w-36 lg:w-44",
    logoHeight: "h-16 lg:h-20",
    spacing: "space-x-1 xl:space-x-3",
    textSize: "text-sm xl:text-base",
    itemPaddingX: "px-2 xl:px-3",
    itemPaddingY: "py-2",
    notificationPosition: "translate-x-0",
    profilePosition: "translate-x-0",
    rightSectionGap: "space-x-2 lg:space-x-4",
  };

  const pathname = usePathname() ?? '';
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Menú desplegable del avatar (escritorio)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menú lateral (móvil y tablet)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar el menú del avatar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar el menú lateral al cambiar de ruta
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Escape para cerrar, bloquear scroll del fondo y manejar el foco
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const menuButton = menuButtonRef.current;
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [isDrawerOpen]);

  return (
    <>
      <header className="w-full bg-[#0F172A] text-white shadow-md font-sans relative z-50">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${config.height} flex items-center justify-between`}>

          {/* Logo institucional */}
          <div className="flex items-center">
            <Link href="/portal" className={`relative block ${config.logoWidth} ${config.logoHeight}`}>
              <Image
                src={logoUmss}
                alt="Logo UMSSPIRA"
                fill
                sizes="(min-width: 1024px) 176px, 144px"
                className="object-contain object-left"
                priority
              />
            </Link>
          </div>

          {/* Menú de escritorio (≥ 1024 px) */}
          <nav
            aria-label="Principal"
            className={`hidden lg:flex items-center ${config.spacing} ${config.textSize} font-medium`}
          >
            {navItems.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center space-x-2 whitespace-nowrap ${config.itemPaddingX} ${config.itemPaddingY} rounded-xl transition-all relative ${
                    active
                      ? 'bg-[#1E293B] text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 xl:w-6 xl:h-6" />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB162] rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sección derecha */}
          <div className={`flex items-center ${config.rightSectionGap} lg:pr-2`}>

            {/* Notificaciones */}
            <button
              type="button"
              aria-label="Notificaciones"
              className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors relative text-slate-300 hover:text-white transform ${config.notificationPosition}`}
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Avatar con dropdown (solo escritorio) */}
            <div className={`relative hidden lg:block transform ${config.profilePosition}`} ref={dropdownRef}>
              <div
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 pl-2 cursor-pointer group py-1"
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-inner group-hover:bg-slate-100 transition-colors">
                  <User className="w-6 h-6 text-slate-800" />
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 py-3 px-2 z-50">
                  <div className="px-3 py-2.5 border-b border-slate-100 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Usuario UMSS</p>
                      <p className="text-xs text-slate-500">Titulado / Egresado</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center space-x-2.5">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Mi perfil</span>
                      </div>
                      <span className="text-slate-400">›</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Botón hamburguesa (< 1024 px) */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-drawer"
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Fondo oscurecido del menú lateral */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Menú lateral (móvil y tablet). Cerrado: "invisible" lo saca del foco y de los lectores de pantalla */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`lg:hidden fixed right-0 top-0 z-[60] flex h-full w-72 max-w-[85%] flex-col bg-[#0F172A] text-white shadow-2xl transition-[transform,visibility] duration-300 ${
          isDrawerOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <span className="font-serif text-lg font-bold">
            UMSS<span className="text-amber-500">PIRA</span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center space-x-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                      active ? 'bg-[#1E293B] text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/profile"
                className="flex min-h-[44px] items-center space-x-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-2">
          <Link
            href="/login"
            className="flex min-h-[44px] items-center space-x-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
export default Navbar;