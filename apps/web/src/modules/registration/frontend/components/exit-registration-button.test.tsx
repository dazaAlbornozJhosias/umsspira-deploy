import { fireEvent, render, screen } from '@testing-library/react';
import { ExitRegistrationButton } from './exit-registration-button';
import { useRegistrationStore } from '../store';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

describe('ExitRegistrationButton', () => {
  beforeEach(() => {
    mockPush.mockReset();
    useRegistrationStore.getState().reset();
  });

  it('sale directo al login si no hay información ingresada', () => {
    render(<ExitRegistrationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del registro' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('advierte la pérdida de datos si hay un registro en curso', () => {
    useRegistrationStore.getState().setSessionToken('token-de-prueba');
    render(<ExitRegistrationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del registro' }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('conserva la información al elegir seguir en el registro', () => {
    useRegistrationStore.getState().setSessionToken('token-de-prueba');
    render(<ExitRegistrationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Seguir en el registro' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(useRegistrationStore.getState().sessionToken).toBe('token-de-prueba');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('borra el borrador y sale al confirmar', () => {
    useRegistrationStore.getState().setSessionToken('token-de-prueba');
    render(<ExitRegistrationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Salir del registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
