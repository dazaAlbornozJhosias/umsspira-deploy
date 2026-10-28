import { render, screen } from '@testing-library/react';

import { AFFINITY_ROUTE } from '@/modules/profile/data/affinity-route';
import AffinityLinkCard from './affinity-link-card';

describe('AffinityLinkCard', () => {
  it('muestra el título "Mi afinidad", la descripción y el botón "Ver mi afinidad"', () => {
    render(<AffinityLinkCard />);

    expect(screen.getByRole('heading', { name: 'Mi afinidad' })).toBeInTheDocument();
    expect(screen.getByText(/qué tan bien encaja tu perfil/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mi afinidad' })).toBeInTheDocument();
  });

  it('el botón lleva a la pantalla de afinidad de la Épica 3', () => {
    render(<AffinityLinkCard />);

    expect(AFFINITY_ROUTE).toBe('/afinidad');
    expect(screen.getByRole('link', { name: 'Ver mi afinidad' })).toHaveAttribute('href', '/afinidad');
  });

  it('no muestra porcentajes del radar', () => {
    render(<AffinityLinkCard />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
