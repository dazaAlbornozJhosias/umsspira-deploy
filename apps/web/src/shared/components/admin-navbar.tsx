"use client";

import { useState } from "react";
import Link from "next/link";

const adminLinks = [
  { href: "/applications", label: "Solicitudes" },
  { href: "/me", label: "Mi perfil" },
  { href: "/profile", label: "Mi perfil profesional" },
];

export interface AdminNavbarProps {
  adminName?: string;
  logoutSlot?: React.ReactNode;
}

export function AdminNavbar({ adminName, logoutSlot }: AdminNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-abyssal-blue">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-white">
            UMSSPIRA
          </span>
          <span className="rounded-full border border-burning-flame px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-burning-flame">
            MÓDULO ADMINISTRATIVO
          </span>
        </div>

        <nav
          aria-label="Navegacion del panel administrativo"
          className="hidden items-center gap-6 md:flex"
        >
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {adminName && (
            <span className="text-sm text-white/70">{adminName}</span>
          )}
          {logoutSlot}
        </nav>

        <button
          type="button"
          aria-label="Abrir menu de navegacion"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white md:hidden"
        >
          <span className="sr-only">Abrir menu</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav
          aria-label="Navegacion del panel administrativo (movil)"
          className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 md:hidden"
        >
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 text-sm font-medium text-white/90 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {adminName && (
            <span className="py-2 text-sm text-white/70">{adminName}</span>
          )}
          {logoutSlot}
        </nav>
      )}
    </header>
  );
}