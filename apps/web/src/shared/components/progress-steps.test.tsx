import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProgressSteps } from './progress-steps';

describe('ProgressSteps', () => {
  it('muestra las tres etapas con sus estados (CA-01.2)', () => {
    render(<ProgressSteps currentStep="email" />);

    expect(screen.getByText('Datos Personales')).toBeInTheDocument();
    expect(screen.getByText('Verificación de Correo')).toBeInTheDocument();
    expect(screen.getByText('Carga de Requisitos')).toBeInTheDocument();
    // La etapa en curso se marca con "En curso" y la actual con aria-current.
    expect(screen.getByText(/En curso/)).toBeInTheDocument();
    expect(screen.getByText('Verificación de Correo').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('resalta solo la etapa actual', () => {
    render(<ProgressSteps currentStep="email" />);

    const current = screen.getByText('Verificación de Correo').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Datos Personales').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Carga de Requisitos').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('marca la primera etapa como actual al iniciar el registro', () => {
    render(<ProgressSteps currentStep="data" />);

    expect(screen.getByText('Datos Personales').closest('li')).toHaveAttribute('aria-current', 'step');
  });
});
