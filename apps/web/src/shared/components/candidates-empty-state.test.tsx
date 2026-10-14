import React from 'react';
import { render, screen } from '@testing-library/react';
import { CandidatesEmptyState } from './candidates-empty-state';

describe('CandidatesEmptyState Component (HU4)', () => {
  it('muestra el mensaje de estado vacío', () => {
    render(<CandidatesEmptyState />);

    expect(screen.getByRole('status')).toHaveTextContent('No hay candidatos disponibles');
  });

  it('no muestra rangos de candidatos ficticios', () => {
    render(<CandidatesEmptyState />);

    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
  });
});