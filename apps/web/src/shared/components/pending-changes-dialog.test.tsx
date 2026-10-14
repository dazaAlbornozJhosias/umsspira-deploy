import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PendingChangesDialog } from './pending-changes-dialog';

describe('PendingChangesDialog', () => {
  const defaultProps = {
    open: true,
    onRecalculate: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no se renderiza cuando está cerrado', () => {
    render(<PendingChangesDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el título y el mensaje de cambios pendientes', () => {
    render(<PendingChangesDialog {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Se detectaron modificaciones')).toBeInTheDocument();
    expect(
      screen.getByText('Actualiza tu información para recalcular tu radar de afinidad.')
    ).toBeInTheDocument();
  });

  it('ubica el foco inicial en el botón primario Recalcular', () => {
    render(<PendingChangesDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Recalcular' })).toHaveFocus();
  });

  it('ejecuta onRecalculate al hacer clic en Recalcular', () => {
    const onRecalculate = jest.fn();
    render(<PendingChangesDialog {...defaultProps} onRecalculate={onRecalculate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    expect(onRecalculate).toHaveBeenCalledTimes(1);
  });

  it('cierra con Ahora no sin ejecutar el recálculo', () => {
    const onDismiss = jest.fn();
    const onRecalculate = jest.fn();
    render(<PendingChangesDialog {...defaultProps} onDismiss={onDismiss} onRecalculate={onRecalculate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('cierra con la tecla Escape', () => {
    const onDismiss = jest.fn();
    render(<PendingChangesDialog {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
