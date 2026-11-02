import { activeSection, navigationFor, NAVBAR_ACCOUNT_LINKS, visibleLinks } from './navigation';

const destinations = (role: Parameters<typeof navigationFor>[0]) => navigationFor(role).flatMap(section => section.items.map(item => item.href)).filter(Boolean);

it('no muestra el catálogo en el menú de eventos y reserva la gestión para administradores', () => {
  expect(destinations(null)).not.toContain('/events/catalog');
  expect(destinations(null)).not.toContain('/events/create');
  expect(destinations('titulado')).toContain('/portal/eventos');
  expect(destinations('titulado')).not.toContain('/events');
  expect(destinations('administrador')).toContain('/events');
  expect(destinations('administrador')).toContain('/events/create');
  expect(destinations('administrador')).toContain('/events/drafts');
  expect(destinations('administrador')).not.toContain('/events/catalog');
  expect(destinations('administrador')).not.toContain('/portal/eventos');
  expect(destinations(null)).not.toContain('/empresa/vacantes/publicar');
});

it('separa los accesos personales del titulado y los empresariales', () => {
  expect(destinations('titulado')).toContain('/mentorship/profile');
  expect(destinations('titulado')).not.toContain('/companies');
  expect(destinations('empresa')).toContain('/empresa/vacantes/publicar');
  expect(destinations('empresa')).not.toContain('/mentorship/profile');
});

it('incorpora reportes y solicitudes a la cuenta de administrador', () => {
  expect(visibleLinks(NAVBAR_ACCOUNT_LINKS, 'administrador').map(item => item.href)).toEqual(expect.arrayContaining(['/reports', '/applications']));
  expect(visibleLinks(NAVBAR_ACCOUNT_LINKS, 'titulado').map(item => item.href)).not.toContain('/reports');
});

it('activa el módulo por la ruta más específica, incluidos los registros dinámicos', () => {
  expect(activeSection('/events/drafts/draft-123')).toBe('events');
  expect(activeSection('/profile/certifications/cert-1/edit')).toBe('directory');
  expect(activeSection('/portal/empleos')).toBe('jobs');
});


it('HU-004/T4.1: muestra reportes al administrador y reserva encuestas para titulado', () => {
  const adminLinks = visibleLinks(NAVBAR_ACCOUNT_LINKS, 'administrador');
  expect(adminLinks).toEqual(expect.arrayContaining([
    expect.objectContaining({ label: 'Reportes Institucionales', href: '/reports' }),
    expect.objectContaining({ id: 'employment-survey-admin', label: 'Encuestas de Empleabilidad', href: '/reports/encuestas' }),
  ]));
  expect(adminLinks.map(link => link.id)).not.toContain('employment-surveys');
  expect(adminLinks.map(link => link.href)).not.toContain('/surveys');

  const graduateLinks = visibleLinks(NAVBAR_ACCOUNT_LINKS, 'titulado');
  expect(graduateLinks.map(link => link.href)).not.toContain('/reports');
  expect(graduateLinks.map(link => link.href)).not.toContain('/reports/encuestas');
  expect(graduateLinks).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'employment-surveys', href: '/surveys' }),
  ]));
  expect(graduateLinks.find(link => link.id === 'employment-surveys')?.pending).toBeUndefined();

  for (const role of ['empresa', null] as const) {
    const links = visibleLinks(NAVBAR_ACCOUNT_LINKS, role).map(link => link.id);
    expect(links).not.toContain('reports');
    expect(links).not.toContain('employment-survey-admin');
    expect(links).not.toContain('employment-surveys');
  }
});
