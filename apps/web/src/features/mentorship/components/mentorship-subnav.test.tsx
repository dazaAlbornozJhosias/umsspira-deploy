import { render, screen } from '@testing-library/react';
import { MentorshipSubnav } from './mentorship-subnav';

let mockPathname = '/mentorship/directory';
let mockQuery = '';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

it('renderiza una sola subnavegación completa y activa Explorar en el directorio', () => {
  render(<MentorshipSubnav />);

  const nav = screen.getByRole('navigation', { name: 'Navegación de mentorías' });
  expect(screen.getAllByRole('navigation', { name: 'Navegación de mentorías' })).toHaveLength(1);
  expect(nav.querySelectorAll('a')).toHaveLength(5);
  expect(screen.getByRole('link', { name: 'Explorar mentores' })).toHaveAttribute('href', '/mentorship/directory');
  expect(screen.getByRole('link', { name: 'Explorar mentores' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/mentorship');
});

it('activa Mi perfil en sus rutas hijas y mantiene separadas las bandejas', () => {
  mockPathname = '/mentorship/profile/information';
  mockQuery = '';
  const { rerender } = render(<MentorshipSubnav />);
  expect(screen.getByRole('link', { name: 'Mi perfil de mentor' })).toHaveAttribute('aria-current', 'page');

  mockPathname = '/mentorship/requests/received';
  mockQuery = 'view=sent';
  rerender(<MentorshipSubnav />);
  expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Solicitudes recibidas' })).not.toHaveAttribute('aria-current', 'page');
});
