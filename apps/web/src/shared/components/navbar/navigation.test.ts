import { activeSection, navigationFor, NAVBAR_ACCOUNT_LINKS, visibleLinks } from './navigation';

const destinations = (role: Parameters<typeof navigationFor>[0]) => navigationFor(role).flatMap(section => section.items.map(item => item.href)).filter(Boolean);

it('permite al visitante explorar eventos sin ofrecer gestión administrativa', () => {
  expect(destinations(null)).toContain('/events/catalog');
  expect(destinations(null)).not.toContain('/events/create');
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
  expect(activeSection('/events/catalog/123')).toBe('events');
  expect(activeSection('/profile/certifications/cert-1/edit')).toBe('directory');
  expect(activeSection('/portal/empleos')).toBe('jobs');
});
