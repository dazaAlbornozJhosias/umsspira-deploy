import type { NavbarLink, NavbarRole, NavbarSection } from './types';

export const NAVBAR_ROLE_LABEL: Record<NavbarRole, string> = {
  titulado: 'Titulado', empresa: 'Empresa', administrador: 'Administración',
};

const members = ['titulado', 'administrador'] as const;
const employers = ['empresa', 'administrador'] as const;
const admins = ['administrador'] as const;

/** Agregar destinos aquí mantiene iguales los menús de escritorio y móvil. */
export const NAVBAR_SECTIONS: NavbarSection[] = [
  { id: 'community', label: 'Comunidad', items: [
    { id: 'portal', label: 'Portal de egresados', href: '/portal' },
    { id: 'community', label: 'Comunidad de egresados', href: '/portal/comunidad' },
    { id: 'benefits', label: 'Beneficios y convenios', href: '/portal/beneficios' },
    { id: 'institutional', label: 'Sobre nosotros', href: '/portal/institucional' },
  ] },
  { id: 'directory', label: 'Directorio', items: [
    { id: 'profile', label: 'Mi perfil profesional', href: '/profile', roles: members },
    { id: 'records', label: 'Mis registros', href: '/profile/records', roles: members },
    { id: 'complete-profile', label: 'Completar mi perfil', href: '/profile/completar', roles: members },
    { id: 'affinity', label: 'Mi afinidad profesional', href: '/afinidad', roles: members },
    { id: 'graduate-directory', label: 'Directorio de egresados', pending: 'El directorio todavía no tiene una pantalla implementada.' },
  ] },
  { id: 'jobs', label: 'Bolsa de trabajo', items: [
    { id: 'jobs', label: 'Oportunidades laborales', href: '/portal/empleos' },
    { id: 'job-postings', label: 'Ofertas laborales actuales', href: '/job-postings' },
    { id: 'company', label: 'Perfil de mi empresa', href: '/companies', roles: employers },
    { id: 'publish-job', label: 'Publicar una vacante', href: '/empresa/vacantes/publicar', roles: employers },
  ] },
  { id: 'mentorship', label: 'Mentorías', items: [
    { id: 'mentorship', label: 'Red de mentorías', href: '/mentorship' },
    { id: 'mentor-profile', label: 'Mi perfil de mentor', href: '/mentorship/profile', roles: members },
    { id: 'mentor-information', label: 'Información de mi perfil', href: '/mentorship/profile/information', roles: members },
    { id: 'mentor-areas', label: 'Áreas técnicas', href: '/mentorship/profile/areas', roles: members },
    { id: 'mentor-interests', label: 'Intereses de mentoría', href: '/mentorship/profile/interests', roles: members },
    { id: 'mentor-availability', label: 'Disponibilidad', href: '/mentorship/profile/availability', roles: members },
  ] },
  { id: 'events', label: 'Eventos', items: [
    { id: 'catalog', label: 'Catálogo de eventos', href: '/events/catalog' },
    { id: 'manage-events', label: 'Gestión de eventos', href: '/events', roles: admins },
    { id: 'create-event', label: 'Crear evento', href: '/events/create', roles: admins },
    { id: 'draft-events', label: 'Borradores', href: '/events/drafts', roles: admins },
  ] },
];

export const NAVBAR_ACCOUNT_LINKS: NavbarLink[] = [
  { id: 'personal', label: 'Mi área personal', href: '/me', roles: members },
  { id: 'my-profile', label: 'Mi perfil profesional', href: '/profile', roles: members },
  { id: 'my-company', label: 'Mi empresa', href: '/companies', roles: employers },
  { id: 'applications', label: 'Solicitudes de registro', href: '/applications', roles: admins },
  { id: 'reports', label: 'Reportes institucionales', href: '/reports', roles: admins },
  { id: 'admin-home', label: 'Panel administrativo', href: '/portal/admin', roles: admins },
];

export function visibleLinks(items: NavbarLink[], role: NavbarRole | null) {
  return items.filter(item => !item.roles || (role !== null && item.roles.includes(role)));
}

export function navigationFor(role: NavbarRole | null): NavbarSection[] {
  return NAVBAR_SECTIONS.map(section => ({ ...section, items: visibleLinks(section.items, role) }));
}

/** La coincidencia más específica evita activar Comunidad por todos sus /portal/*. */
export function activeSection(path: string): string | null {
  const matches = NAVBAR_SECTIONS.flatMap(section => section.items
    .filter(item => item.href && (path === item.href || (item.href !== '/portal' && path.startsWith(`${item.href}/`))))
    .map(item => ({ section: section.id, length: item.href!.length })));
  return matches.sort((a, b) => b.length - a.length)[0]?.section ?? null;
}
