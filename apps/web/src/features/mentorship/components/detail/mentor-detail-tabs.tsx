import Link from 'next/link';
import { CompassIcon, LayoutGridIcon, SendIcon, UserRoundCogIcon } from 'lucide-react';

/**
 * Pestañas de navegación del módulo de mentorías para la vista de detalle.
 * Reutiliza las clases .directory-tabs existentes.
 * "Mis solicitudes" permanece deshabilitada (aria-disabled) al no existir aún esa ruta.
 */
export function MentorDetailTabs() {
  return (
    <nav className="directory-tabs mentor-detail-tabs" aria-label="Navegación de mentorías">
      <Link href="/mentorship">
        <LayoutGridIcon className="icon" aria-hidden="true" />
        Inicio
      </Link>
      <Link href="/mentorship/directory" aria-current="page">
        <CompassIcon className="icon" aria-hidden="true" />
        Explorar mentores
      </Link>
      <span
        className="mentor-detail-tab-disabled"
        role="link"
        aria-disabled="true"
        tabIndex={-1}
      >
        <SendIcon className="icon" aria-hidden="true" />
        Mis solicitudes
      </span>
      <Link href="/mentorship/profile">
        <UserRoundCogIcon className="icon" aria-hidden="true" />
        Mi perfil de mentor
      </Link>
    </nav>
  );
}
