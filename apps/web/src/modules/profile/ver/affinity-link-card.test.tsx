import { render, screen } from '@testing-library/react';

import { AFFINITY_ROUTE } from '@/modules/profile/data/affinity-route';
import AffinityLinkCard from './affinity-link-card';

describe('AffinityLinkCard', () => {
  it('muestra el título, la descripción y el botón "Ver mi afinidad"', () => {
    render(<AffinityLinkCard />);

    expect(screen.getByRole('heading', { name: 'Afinidad profesional' })).toBeInTheDocument();
    expect(screen.getByText(/qué tan bien encaja tu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mi afinidad' })).toBeInTheDocument();
  });

  it('el botón apunta a la ruta definida para la Épica 3', () => {
    render(<AffinityLinkCard />);

    expect(screen.getByRole('link', { name: 'Ver mi afinidad' })).toHaveAttribute('href', AFFINITY_ROUTE);
  });
});
