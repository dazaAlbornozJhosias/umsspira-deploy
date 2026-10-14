import Link from "next/link";

import { LogoutButton } from "./logout-button";

// Encabezado del área personal: sin ningún menú administrativo (CA-05.3 y CA-05.5).
// Solo agrega el acceso al perfil profesional del titulado (Épica 2).
export function TituladoHeader() {
  return (
    <header className="w-full bg-abyssal-blue">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <span className="font-display text-lg font-bold text-white">UMSSPIRA</span>
        <nav aria-label="Navegacion del titulado" className="flex items-center gap-6">
          <Link href="/profile" className="text-sm font-medium text-white/90 hover:text-white">
            Mi perfil profesional
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}