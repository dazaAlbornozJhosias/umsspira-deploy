import { Bell, Menu, Search, X } from 'lucide-react';

import { BrandMark } from '@/shared/components/app-sidebar';

type AppHeadbarProps = {
  userName: string;
  userRole: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

// Barra superior con buscador, notificaciones y usuario (formato Epic 8)
export function AppHeadbar({ userName, userRole, isMenuOpen, onToggleMenu }: AppHeadbarProps) {
  const initials = getInitials(userName);

  return (
    <>
      {/* Cabecera móvil */}
      <header className="flex items-center justify-between bg-blue-fantastic px-4 py-3 lg:hidden">
        <BrandMark />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Buscar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            onClick={onToggleMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-white"
          >
            {isMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Cabecera de escritorio */}
      <header className="hidden items-center justify-between gap-6 lg:flex">
        <label className="flex h-11 w-full max-w-[480px] items-center gap-3 rounded-full border border-abyssal-blue/15 bg-white px-4">
          <Search className="h-4 w-4 text-blue-fantastic" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar en la plataforma..."
            className="w-full bg-transparent text-sm text-blue-fantastic placeholder:text-blue-fantastic/70 focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-abyssal-blue/15 bg-white text-blue-fantastic"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-fantastic text-sm font-bold text-white">
              {initials}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold text-blue-fantastic">{userName}</span>
              <span className="text-xs text-blue-fantastic/70">{userRole}</span>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
