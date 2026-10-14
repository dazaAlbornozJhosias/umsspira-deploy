import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecalculateButton } from './recalculate-button';

describe('RecalculateButton Component', () => {
  const defaultProps = {
    hasPendingChanges: false,
    isLoading: false,
    onRecalculate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra botón deshabilitado cuando no hay cambios pendientes', () => {
    render(<RecalculateButton {...defaultProps} hasPendingChanges={false} />);

    const button = screen.getByRole('button', { name: 'Recalcular' });
    expect(button).toBeDisabled();
  });

  it('muestra botón habilitado cuando hay cambios pendientes', () => {
    render(<RecalculateButton {...defaultProps} hasPendingChanges={true} />);

    const button = screen.getByRole('button', { name: 'Recalcular' });
    expect(button).toBeEnabled();
  });

  it('ejecuta onRecalculate al hacer clic con cambios pendientes', () => {
    const onRecalculate = jest.fn();
    render(<RecalculateButton {...defaultProps} hasPendingChanges={true} onRecalculate={onRecalculate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    expect(onRecalculate).toHaveBeenCalledTimes(1);
  });

  it('muestra estado de carga y deshabilita el botón', () => {
    render(<RecalculateButton {...defaultProps} hasPendingChanges={true} isLoading={true} />);

    const button = screen.getByRole('button', { name: /rec/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Recalculando...')).toBeInTheDocument();
  });

  it('evita doble recálculo cuando isLoading es true', () => {
    const onRecalculate = jest.fn();
    render(<RecalculateButton {...defaultProps} hasPendingChanges={true} isLoading={true} onRecalculate={onRecalculate} />);

    const button = screen.getByRole('button', { name: /rec/i });
    fireEvent.click(button);
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('no muestra avisos inline de error ni de cambios', () => {
    render(<RecalculateButton {...defaultProps} hasPendingChanges={true} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/se detectaron modificaciones/i)).not.toBeInTheDocument();
  });
});
