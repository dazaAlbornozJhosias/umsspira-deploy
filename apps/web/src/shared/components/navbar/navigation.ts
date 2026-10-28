import type { NavbarLink, NavbarRole, NavbarSection } from './types';

export const NAVBAR_ROLE_LABEL: Record<NavbarRole, string> = {
  titulado: 'Titulado', empresa: 'Empresa', administrador: 'Administración',
};

const members = ['titulado', 'administrador'] as const;
const employers = ['empresa', 'administrador'] as const;
const admins = ['administrador'] as const;
const graduates = ['titulado'] as const;

/** Agregar destinos aquí mantiene iguales los menús de escritorio y móvil. */
export const NAVBAR_SECTIONS: NavbarSection[] = [
  { id: 'community', label: 'Comunidad', items: [
    { id: 'inst-comunidad', label: 'Comunidad institucional', href: '/portal/institucional?tab=comunidad' },
    { id: 'inst-carreras', label: 'Carreras', href: '/portal/institucional?tab=carreras' },
    { id: 'institutional', label: 'Sobre nosotros', href: '/portal/institucional?tab=nosotros' },
    { id: 'portal', label: 'Portal de egresados', href: '/portal' },
    { id: 'community', label: 'Comunidad de egresados', href: '/portal/comunidad' },
    { id: 'benefits', label: 'Beneficios y convenios', href: '/portal/beneficios' },
  ] },
  { id: 'directory', label: 'Directorio', items: [
    { id: 'graduate-directory', label: 'Directorio de egresados', href: '/portal/institucional?tab=directorio' },
    { id: 'profile', label: 'Mi perfil profesional', href: '/profile', roles: members },
    { id: 'records', label: 'Mis registros', href: '/profile/records', roles: members },
    { id: 'complete-profile', label: 'Completar mi perfil', href: '/profile/completar', roles: members },
    { id: 'affinity', label: 'Mi afinidad profesional', href: '/afinidad', roles: members },
  ] },
  { id: 'jobs', label: 'Bolsa de trabajo', items: [
    { id: 'inst-empleos', label: 'Sobre la bolsa de trabajo', href: '/portal/institucional?tab=empleos' },
    { id: 'jobs', label: 'Oportunidades laborales', href: '/portal/empleos' },
    { id: 'job-postings', label: 'Ofertas laborales actuales', href: '/job-postings' },
    { id: 'company', label: 'Perfil de mi empresa', href: '/companies', roles: employers },
    { id: 'publish-job', label: 'Publicar una vacante', href: '/empresa/vacantes/publicar', roles: employers },
  ] },
  { id: 'mentorship', label: 'Mentorías', items: [
    { id: 'inst-mentorias', label: 'Sobre las mentorías', href: '/portal/institucional?tab=mentorias' },
    { id: 'mentorship', label: 'Red de mentorías', href: '/mentorship' },
    { id: 'mentor-profile', label: 'Mi perfil de mentor', href: '/mentorship/profile', roles: members },
    { id: 'mentor-information', label: 'Información de mi perfil', href: '/mentorship/profile/information', roles: members },
    { id: 'mentor-areas', label: 'Áreas técnicas', href: '/mentorship/profile/areas', roles: members },
    { id: 'mentor-interests', label: 'Intereses de mentoría', href: '/mentorship/profile/interests', roles: members },
    { id: 'mentor-availability', label: 'Disponibilidad', href: '/mentorship/profile/availability', roles: members },
  ] },
  { id: 'events', label: 'Eventos', items: [
    { id: 'inst-events', label: 'Eventos institucionales', href: '/portal/institucional?tab=eventos' },
    { id: 'catalog', label: 'Catálogo de eventos', href: '/portal/eventos', roles: graduates },
    { id: 'manage-events', label: 'Gestión de eventos', href: '/events', roles: admins },
    { id: 'create-event', label: 'Crear evento', href: '/events/create', roles: admins },
    { id: 'draft-events', label: 'Borradores', href: '/events/drafts', roles: admins },
  ] },
];

export const NAVBAR_ACCOUNT_LINKS: NavbarLink[] = [
  { id: 'my-profile', label: 'Mi perfil profesional', href: '/profile', roles: members },
  { id: 'my-company', label: 'Mi empresa', href: '/companies', roles: employers },
  { id: 'applications', label: 'Solicitudes de registro', href: '/applications', roles: admins },
  { id: 'reports', label: 'Reportes Institucionales', href: '/reports', roles: admins },
  // HU-004 CA-04: el administrador consulta el área institucional de encuestas,
  // que NO es el formulario /surveys reservado para titulados.
  { id: 'employment-survey-admin', label: 'Encuestas de Empleabilidad', href: '/reports/encuestas', roles: admins },
  // La vista /surveys aún pertenece a otra task; no enlazar una ruta inexistente.
  { id: 'employment-surveys', label: 'Encuesta de empleabilidad', pending: 'Disponible al integrar la vista /surveys', roles: graduates },
  { id: 'admin-home', label: 'Panel administrativo', href: '/portal/admin', roles: admins },
];

export function visibleLinks(items: NavbarLink[], role: NavbarRole | null) {
  return items.filter(item => !item.roles || (role !== null && item.roles.includes(role)));
}

export function navigationFor(role: NavbarRole | null): NavbarSection[] {
  return NAVBAR_SECTIONS.map(section => ({ ...section, items: visibleLinks(section.items, role) }));
}

/**
 * La coincidencia más específica evita activar Comunidad por todos sus /portal/*.
 * Los enlaces con query (?tab=...) solo coinciden si la query actual también los incluye,
 * y ganan sobre los enlaces sin query de la misma ruta.
 */
export function activeSection(path: string, search = ''): string | null {
  const current = new URLSearchParams(search);
  const matches = NAVBAR_SECTIONS.flatMap(section => section.items.flatMap(item => {
    if (!item.href) return [];
    const [hrefPath, hrefQuery = ''] = item.href.split('?');
    const wanted = Array.from(new URLSearchParams(hrefQuery));
    const samePath = path === hrefPath || (hrefPath !== '/portal' && path.startsWith(`${hrefPath}/`));
    const sameQuery = wanted.every(([key, value]) => current.get(key) === value);
    if (!samePath || !sameQuery) return [];
    return [{ section: section.id, score: hrefPath.length + wanted.length * 1000 }];
  }));
  return matches.sort((a, b) => b.score - a.score)[0]?.section ?? null;
}
