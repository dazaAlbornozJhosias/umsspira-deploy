import { fireEvent, render, screen, within } from '@testing-library/react';
import { MentorDirectoryCard } from './mentor-directory-card';
import { mentorInitials, type DirectoryMentor } from '../../model/mentor-directory';

const mentor: DirectoryMentor = { id: 'paola', name: 'Paola Méndez Arce', description: 'Orientación en seguridad de aplicaciones.',
  photoUrl: null, availability: 'AVAILABLE', profession: 'Analista de Ciberseguridad | Empresa de prueba',
  areas: [{ id: 'security', name: 'Ciberseguridad' }],
  interests: ['Seguridad web', 'Gestión de identidades', 'Pentesting', 'Seguridad de redes'].map((name, index) => ({ id: String(index), name, areaId: 'security' })),
};

it.each([
  ['Paola Méndez Arce', 'PM'], ['Rodrigo Salazar Torrico', 'RS'], ['Gabriel Torres', 'GT'],
  ['María Arce', 'MA'], ['Ing. Carlos Mendoza', 'CM'], ['Ana', 'A'], ['', 'M'],
])('genera las iniciales de %s sin inventar identidad', (name, initials) => {
  expect(mentorInitials(name)).toBe(initials);
});

it('muestra los datos del perfil y el indicador de intereses adicionales', () => {
  render(<MentorDirectoryCard mentor={mentor} />);
  expect(screen.getByRole('heading', { name: mentor.name })).toBeInTheDocument();
  expect(screen.getByText(mentor.profession!)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: `Avatar de ${mentor.name}` })).toHaveTextContent('PM');
  expect(screen.getByText('+1')).toHaveAttribute('aria-label', '1 interés adicional: Seguridad de redes');
  expect(screen.getByRole('link', { name: `Ver perfil de ${mentor.name}` })).toHaveAttribute('href', '/mentorship/mentors/paola');
  expect(screen.getByText('Disponible')).toBeInTheDocument();
});

it('reemplaza una fotografía que no carga por las iniciales', () => {
  const { container } = render(<MentorDirectoryCard mentor={{ ...mentor, photoUrl: 'https://example.com/photo.jpg' }} />);
  const photo = container.querySelector('img')!;
  fireEvent.error(photo);
  expect(container.querySelector('img')).not.toBeInTheDocument();
  expect(within(screen.getByRole('img', { name: `Avatar de ${mentor.name}` })).getByText('PM')).toBeInTheDocument();
});

it('distingue un campo pendiente del backend de un perfil sin intereses registrados', () => {
  const view = render(<MentorDirectoryCard mentor={{ ...mentor, profession: undefined, interests: undefined }} />);
  expect(screen.getByText('Información de intereses no disponible')).toBeInTheDocument();
  expect(screen.queryByText('Analista de Ciberseguridad | Empresa de prueba')).not.toBeInTheDocument();
  view.rerender(<MentorDirectoryCard mentor={{ ...mentor, interests: [] }} />);
  expect(screen.getByText('Sin intereses registrados')).toBeInTheDocument();
  expect(screen.queryByText('+1')).not.toBeInTheDocument();
});
