import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';

describe('ProgressBar Component', () => {
  it('renderiza correctamente el porcentaje redondeado y clampeado', () => {
    render(<ProgressBar value={82.5} label="Desarrollo de Software" />);

    expect(screen.getByText('Desarrollo de Software')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '83');
    expect(progressbar).toHaveStyle({ width: 'clamp(0%, 83%, 100%)' });
  });

  it('aplica clamp visual en 0% para valores negativos', () => {
    render(<ProgressBar value={-15} label="Prueba Negativa" />);

    expect(screen.getByText('0%')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar).toHaveStyle({ width: 'clamp(0%, 0%, 100%)' });
  });

  it('aplica clamp visual en 100% para valores mayores a 100', () => {
    render(<ProgressBar value={120} label="Prueba Exceso" />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    expect(progressbar).toHaveStyle({ width: 'clamp(0%, 100%, 100%)' });
  });
});
