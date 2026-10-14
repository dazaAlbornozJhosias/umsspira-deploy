'use client';

import { useState } from 'react';

import { AppHeadbar } from '@/shared/components/app-headbar';
import { AppSidebar } from '@/shared/components/app-sidebar';

type DashboardShellProps = {
  activeHref: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
};

// Estructura de pantalla autenticada: barra lateral + barra superior + contenido
export function DashboardShell({ activeHref, userName, userRole, children }: DashboardShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-palladian text-blue-fantastic">
      <AppSidebar activeHref={activeHref} isOpen={isMenuOpen} />

      {isMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-30 bg-abyssal-blue/40 lg:hidden"
        />
      )}

      <div className="lg:pl-[260px]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 lg:px-10 lg:py-6">
          <AppHeadbar
            userName={userName}
            userRole={userRole}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((isOpen) => !isOpen)}
          />
          <main className="px-4 pb-8 pt-2 lg:px-0 lg:pt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
