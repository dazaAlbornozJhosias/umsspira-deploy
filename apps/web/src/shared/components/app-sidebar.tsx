import {
  Briefcase,
  CalendarDays,
  Home,
  Info,
  MessageSquare,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/shared/utils/cn';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Mi perfil', href: '/profile', icon: User },
  { label: 'Directorio', href: '#', icon: Users },
  { label: 'Foro de discusión', href: '#', icon: MessageSquare },
  { label: 'Oportunidades', href: '#', icon: Briefcase },
  { label: 'Eventos', href: '#', icon: CalendarDays },
  { label: 'Sobre nosotros', href: '#', icon: Info },
];

type AppSidebarProps = {
  activeHref: string;
  isOpen: boolean;
};

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/umsspira-logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0" priority />
      <span className="flex flex-col">
        <span className="text-base font-extrabold leading-5 text-white">UMSSPIRA</span>
        <span className="text-[10px] font-bold uppercase text-burning-flame">Red de Egresados</span>
      </span>
    </div>
  );
}

// Barra lateral de navegación (formato Epic 8)
export function AppSidebar({ activeHref, isOpen }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-[260px] flex-col justify-between bg-blue-fantastic px-5 py-6 lg:flex',
        isOpen ? 'flex' : 'hidden',
      )}
    >
      <div className="flex flex-col gap-10">
        <div className="px-1.5 pt-4">
          <BrandMark />
        </div>

        <nav aria-label="Navegación principal">
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = href === activeHref;
              return (
                <li key={label}>
                  <a
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/85 transition hover:bg-white/10',
                      isActive && 'border border-burning-flame text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-1 border-t border-white/20 pt-4">
        <span className="text-xs font-bold text-white">Ingeniería de Sistemas</span>
        <span className="text-xs text-oatmeal">FCyT - UMSS</span>
      </div>
    </aside>
  );
}
