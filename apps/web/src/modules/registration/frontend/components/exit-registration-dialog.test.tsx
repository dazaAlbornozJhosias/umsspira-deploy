import { fireEvent, render, screen } from '@testing-library/react';
import { ExitRegistrationDialog } from './exit-registration-dialog';

describe('ExitRegistrationDialog', () => {
  it('no se muestra cuando está cerrado', () => {
    render(<ExitRegistrationDialog isOpen={false} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('advierte la pérdida de datos', () => {
    render(<ExitRegistrationDialog isOpen onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText('Se perderán los datos ingresados.')).toBeTruthy();
  });

  it('confirma la salida con el botón Salir', () => {
    const onConfirm = jest.fn();
    render(<ExitRegistrationDialog isOpen onConfirm={onConfirm} onCancel={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('conserva los datos con Seguir en el registro y con Escape', () => {
    const onCancel = jest.fn();
    render(<ExitRegistrationDialog isOpen onConfirm={jest.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seguir en el registro' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
