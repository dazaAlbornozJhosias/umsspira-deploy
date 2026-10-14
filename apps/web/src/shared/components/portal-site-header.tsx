"use client";

import { Navbar } from "@/shared/components/navbar";

// Encabezado único del portal: el Navbar se monta una sola vez para todas las rutas
export function PortalSiteHeader() {
  return <Navbar />;
}