import type { ReactNode } from 'react';

export type NavbarRole = 'titulado' | 'empresa' | 'administrador';

export interface NavbarSession {
  name: string;
  role: NavbarRole;
  initials: string;
}

export interface NavbarLink {
  id: string;
  label: string;
  href?: string;
  roles?: readonly NavbarRole[];
  pending?: string;
  /** Solo para visitantes: se oculta cuando hay sesión iniciada. */
  guestOnly?: boolean;
  /** No se muestra en el menú, pero sigue sirviendo para saber qué sección está activa. */
  hidden?: boolean;
}

export interface NavbarSection {
  id: string;
  label: string;
  items: NavbarLink[];
}

export interface NavbarActivity {
  id: string;
  title: string;
  description: string;
  href?: string;
  unread?: boolean;
}

/** La sesión y las acciones las entrega la aplicación; la barra no autentica. */
export interface NavbarProps {
  session: NavbarSession | null;
  /** Aún se está verificando la sesión: se muestra una barra vacía, sin botones de cuenta. */
  loading?: boolean;
  onLogout: () => void;
  currentPath?: string;
  resolveHref?: (href: string) => string;
  onLogin?: () => void;
  onSearch?: () => void;
  notifications?: NavbarActivity[];
  messages?: NavbarActivity[];
  accountExtra?: ReactNode;
}