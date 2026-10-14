import React from 'react';
import { render, screen } from '@testing-library/react';
import { AffinitySkeleton } from './affinity-skeleton';

describe('AffinitySkeleton', () => {
  it('anuncia la carga accesiblemente y conserva la estructura de ambas tarjetas', () => {
    const { container } = render(<AffinitySkeleton />);

    expect(screen.getByRole('status', { name: 'Cargando tu radar de afinidad' })).toBeInTheDocument();
    expect(screen.getByText('Leyendo tu radar de afinidad...')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(15);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
});
