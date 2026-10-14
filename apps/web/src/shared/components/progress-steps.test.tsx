import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProgressSteps } from './progress-steps';

describe('ProgressSteps', () => {
  it('muestra las etapas por nombre y sin números de paso (CA-01.2)', () => {
    render(<ProgressSteps currentStep="data" />);

    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Verificación de correo')).toBeInTheDocument();
    expect(screen.getByText('Documento')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Progreso del registro' })).not.toHaveTextContent(/\d/);
  });

  it('resalta solo la etapa actual', () => {
    render(<ProgressSteps currentStep="email" />);

    const current = screen.getByText('Verificación de correo').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Datos').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Documento').closest('li')).not.toHaveAttribute('aria-current');
  });
});
