import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreatePasswordForm } from './create-password-form';

function fillForm(password: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), {
    target: { value: confirmPassword },
  });
}

describe('CreatePasswordForm', () => {
  it('oculta la contraseña por defecto y la muestra con el ojo', () => {
    render(<CreatePasswordForm onSubmit={jest.fn()} />);
    const input = screen.getByLabelText(/^Contraseña/);
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('marca los requisitos mientras se escribe', () => {
    render(<CreatePasswordForm onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'Abc12345' } });
    expect(screen.getByText('Un número').closest('li')).toHaveAttribute('data-met', 'true');
  });

  it('no envía si las contraseñas no coinciden', async () => {
    const onSubmit = jest.fn();
    render(<CreatePasswordForm onSubmit={onSubmit} />);
    fillForm('Abc12345', 'Abc99999');
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor y no activa', async () => {
    const onSubmit = jest.fn().mockResolvedValue('No fue posible activar la cuenta. Inténtalo nuevamente.');
    render(<CreatePasswordForm onSubmit={onSubmit} />);
    fillForm('Abc12345', 'Abc12345');
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible activar la cuenta');
  });

  it('envía cuando los datos son válidos', async () => {
    const onSubmit = jest.fn().mockResolvedValue(null);
    render(<CreatePasswordForm onSubmit={onSubmit} />);
    fillForm('Abc12345', 'Abc12345');
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ password: 'Abc12345', confirmPassword: 'Abc12345' }),
    );
  });
});