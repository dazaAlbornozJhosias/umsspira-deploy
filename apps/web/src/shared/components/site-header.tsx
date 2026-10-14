import Link from "next/link";
import { Button } from "./button";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/comunidad", label: "Comunidad" },
  { href: "/directorio", label: "Directorio" },
  { href: "/carreras", label: "Carreras" },
  { href: "/eventos", label: "Eventos" },
];

export function SiteHeader() {
  return (
    <header className="h-[72px] w-full bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-bold text-abyssal-blue">
          UMSSPIRA
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-abyssal-blue">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
             <Button variant="secondary" className="whitespace-nowrap px-3 text-xs sm:px-6 sm:text-sm">
                Iniciar sesion
             </Button>
          <Button variant="primary">Registro</Button>
        </div>
      </div>
    </header>
  );
}
