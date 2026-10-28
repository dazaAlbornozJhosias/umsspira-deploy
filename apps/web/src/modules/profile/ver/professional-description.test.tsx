import { render, screen } from '@testing-library/react';

import ProfessionalDescription from './professional-description';

describe('ProfessionalDescription', () => {
  it('muestra la descripción profesional del egresado', () => {
    render(<ProfessionalDescription description="Ingeniero de sistemas con 7 años de experiencia." />);

    expect(screen.getByRole('heading', { name: 'Descripción profesional' })).toBeInTheDocument();
    expect(screen.getByText('Ingeniero de sistemas con 7 años de experiencia.')).toBeInTheDocument();
  });

  it('muestra "Sin registros" si no hay descripción', () => {
    render(<ProfessionalDescription description="" />);

    expect(screen.getByText('Sin registros')).toBeInTheDocument();
  });
});
