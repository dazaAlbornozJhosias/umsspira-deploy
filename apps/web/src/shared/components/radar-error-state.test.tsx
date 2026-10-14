import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarErrorState } from './radar-error-state';

describe('RadarErrorState', () => {
  const defaultProps = {
    onRetry: jest.fn(),
    isRetrying: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el aviso de error con role alert', () => {
    render(<RadarErrorState {...defaultProps} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('No se pudo actualizar tu radar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra exactamente el mensaje del criterio de HU-3', () => {
    render(<RadarErrorState {...defaultProps} />);

    const message = screen.getByText('No se pudo actualizar tu radar');

    expect(message.textContent).toBe('No se pudo actualizar tu radar');
  });

  it('ejecuta onRetry al hacer clic en Reintentar', () => {
    const onRetry = jest.fn();
    render(<RadarErrorState {...defaultProps} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('deshabilita Reintentar mientras isRetrying es true', () => {
    const onRetry = jest.fn();
    render(<RadarErrorState {...defaultProps} onRetry={onRetry} isRetrying={true} />);

    const button = screen.getByRole('button', { name: 'Reintentar' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
