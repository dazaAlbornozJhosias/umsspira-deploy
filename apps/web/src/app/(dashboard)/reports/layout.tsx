import type { ReactNode } from "react";
import { AdminReportsNavigation } from "@/modules/auth/frontend/components/admin-reports-navigation";

/**
 * HU-004: capa de navegación institucional, independiente del contenido
 * de reportería (T4.2 y T4.4) y de los formularios del titulado.
 */
export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mx-auto w-full px-6 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-truffle-trouble">
          Administrador de Carrera
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-abyssal-blue">
          Portal Administrativo
        </h1>
        <AdminReportsNavigation />
      </div>
      {children}
    </div>
  );
}
