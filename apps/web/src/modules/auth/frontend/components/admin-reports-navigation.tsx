"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * HU-004 / T4.1: navegación secundaria del administrador.
 * El navbar global se mantiene en el layout padre y se reutiliza tal cual.
 */
const sections = [
  { href: "/reports", label: "Reportes Institucionales" },
  { href: "/reports/encuestas", label: "Encuestas de Empleabilidad" },
] as const;

export function AdminReportsNavigation() {
  const pathname = usePathname() ?? "/reports";

  return (
    <nav
      aria-label="Módulos administrativos"
      className="mt-5 flex w-full flex-col gap-2 border-b border-oatmeal pb-3 sm:flex-row sm:gap-3"
    >
      {sections.map(({ href, label }) => {
        const active = href === "/reports"
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2.5 text-center text-sm font-semibold transition-colors " +
              (active
                ? "border-abyssal-blue bg-abyssal-blue text-white"
                : "border-oatmeal bg-white text-abyssal-blue hover:bg-oatmeal/30")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
