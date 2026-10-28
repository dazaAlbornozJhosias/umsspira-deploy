
'use client';

import { usePathname } from 'next/navigation';
import { Navbar as LegacyNavbar } from '@/shared/components/navbar';
import { ConnectedNavbar } from '@/shared/components/navbar/index';

// Encabezado único del portal: selecciona el Navbar según la ruta.
export function PortalSiteHeader() {
  const pathname = usePathname() ?? '';

  const normalizedPath = pathname.replace(/\/+$/, '');

  return normalizedPath === '/portal/institucional' ? (
    <ConnectedNavbar />
  ) : (
    <LegacyNavbar />
  );
}
