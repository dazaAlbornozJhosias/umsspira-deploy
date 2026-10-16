"use client";

import { usePathname } from "next/navigation";
import { Navbar as LegacyNavbar } from "@/shared/components/navbar";
import { ConnectedNavbar } from "@/shared/components/navbar/index";

// Encabezado único del portal: el Navbar se monta una sola vez para todas las rutas
export function PortalSiteHeader() {
  const pathname = usePathname() ?? "";
  return pathname.replace(/\/$/, "") === "/portal/institucional"
    ? <ConnectedNavbar />
    : <LegacyNavbar />;
}
