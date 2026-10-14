'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Calendar, Briefcase, Award, Star, Users, User, LogOut } from 'lucide-react';

// Mismas secciones que el navbar de escritorio
const sections = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'jobs', label: 'Bolsa de trabajo', icon: Briefcase },
  { id: 'mentorias', label: 'Mentorías', icon: Award },
  { id: 'benefits', label: 'Beneficios', icon: Star },
  { id: 'community', label: 'Comunidad', icon: Users },
];

interface MobileMenuProps {
  onLogout?: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const pathname = usePathname();

  const isProfileActive = pathname.startsWith('/profile');

  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-3 min-h-11 px-3 rounded-xl text-left text-base font-medium border-l-4 ${
      active
        ? 'bg-[#1E293B] text-white border-[#FFB162]'
        : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`;

  // Cerrar el panel al navegar a otra página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar el panel si la pantalla pasa a escritorio (≥ 768 px), por ejemplo al rotar
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Cerrar con Escape y bloquear el scroll de fondo mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <div className="md:hidden">
      {/* Botón hamburguesa */}
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(true)}
        className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Fondo oscuro: tocar fuera cierra el panel */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <aside
        id="mobile-drawer"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85%] flex-col bg-[#0F172A] shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-700/60 px-4">
          <span className="font-serif text-lg font-bold text-white">
            UMSS<span className="text-[#FFB162]">PIRA</span>
          </span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Menú móvil">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              tabIndex={open ? 0 : -1}
              aria-current={activeTab === id ? 'page' : undefined}
              className={itemClass(activeTab === id)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}

          <Link
            href="/profile"
            tabIndex={open ? 0 : -1}
            aria-current={isProfileActive ? 'page' : undefined}
            className={itemClass(isProfileActive)}
          >
            <User className="w-5 h-5" />
            Perfil
          </Link>
        </nav>

        {/* Cerrar sesión al final del panel */}
        <div className="border-t border-slate-700/60 p-3">
          <button
            type="button"
            onClick={handleLogout}
            tabIndex={open ? 0 : -1}
            className="flex w-full items-center gap-3 min-h-11 px-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </div>
  );
};