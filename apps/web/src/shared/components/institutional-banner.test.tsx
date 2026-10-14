import { render, screen } from '@testing-library/react';
import { InstitutionalBanner } from './institutional-banner';

describe('InstitutionalBanner', () => {
  it('renderiza correctamente el título y los botones', () => {
    render(<InstitutionalBanner />);
    
    expect(screen.getByText('CONVENIOS EMPRESARIALES FCYT')).toBeInTheDocument();
    
    const primaryBtn = screen.getByRole('button', { name: /Solicitar Alianza Corporativa/i });
    const secondaryBtn = screen.getByRole('button', { name: /Descargar Guía de Validación SIS/i });
    
    expect(primaryBtn).toBeInTheDocument();
    expect(secondaryBtn).toBeInTheDocument();
    
    expect(primaryBtn).toHaveAttribute('type', 'button');
    expect(secondaryBtn).toHaveAttribute('type', 'button');
  });
});