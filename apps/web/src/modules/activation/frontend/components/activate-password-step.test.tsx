/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivatePasswordStep } from './activate-password-step';
import { activationService } from '../services/activation.service';

jest.mock('../services/activation.service', () => ({
  activationService: {
    activateAccount: jest.fn(),
  },
}));

describe('ActivatePasswordStep', () => {
  const mockOnSuccess = jest.fn();
  const mockOnBackToOtp = jest.fn();
  const validToken = 'signed-activation-token-xyz';
  const testAppId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza inputs de contraseña y verificar contraseña, lista de requisitos y botón desactivado (CA-06.3)', () => {
    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
        onSuccess={mockOnSuccess}
        onBackToOtp={mockOnBackToOtp}
      />,
    );

    expect(screen.getByText(/crea tu nueva contraseña/i)).toBeTruthy();
    expect(screen.getByLabelText(/^nueva contraseña \*/i)).toBeTruthy();
    expect(screen.getByLabelText(/^verificar contraseña \*/i)).toBeTruthy();

    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeTruthy();
    expect(screen.getByText(/al menos una letra mayúscula/i)).toBeTruthy();
    expect(screen.getByText(/al menos una letra minúscula/i)).toBeTruthy();
    expect(screen.getByText(/al menos un número/i)).toBeTruthy();
    expect(screen.getByText(/al menos un carácter especial o símbolo/i)).toBeTruthy();
    expect(screen.getByText(/ambas contraseñas coinciden/i)).toBeTruthy();

    const submitBtn = screen.getByRole('button', { name: /^activar cuenta/i });
    expect(submitBtn).toBeDisabled();
  });

  it('permite alternar la visibilidad de ambas contraseñas mediante botones de ojo (CA-06.3)', () => {
    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
      />,
    );

    const passwordInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/^verificar contraseña \*/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    const togglePasswordBtn = screen.getByRole('button', { name: /mostrar contraseña/i });
    fireEvent.click(togglePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hidePasswordBtn = screen.getByRole('button', { name: /ocultar contraseña/i });
    fireEvent.click(hidePasswordBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleConfirmBtn = screen.getByRole('button', {
      name: /mostrar verificación de contraseña/i,
    });
    fireEvent.click(toggleConfirmBtn);
    expect(confirmInput).toHaveAttribute('type', 'text');

    const hideConfirmBtn = screen.getByRole('button', {
      name: /ocultar verificación de contraseña/i,
    });
    fireEvent.click(hideConfirmBtn);
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('habilita el botón «Activar cuenta» solo al cumplir todas las políticas y coincidencia (CA-06.3)', () => {
    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
      />,
    );

    const passwordInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/^verificar contraseña \*/i);
    const submitBtn = screen.getByRole('button', { name: /^activar cuenta/i });

    // Incompleta: solo minúsculas y números (falta mayúscula, símbolo, longitud < 8)
    fireEvent.change(passwordInput, { target: { value: 'pass1' } });
    fireEvent.change(confirmInput, { target: { value: 'pass1' } });
    expect(submitBtn).toBeDisabled();

    // Cumple longitud, mayúscula, minúscula, pero falta símbolo
    fireEvent.change(passwordInput, { target: { value: 'Password12' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12' } });
    expect(submitBtn).toBeDisabled();

    // Contraseñas no coinciden
    fireEvent.change(passwordInput, { target: { value: 'Password12!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12?' } });
    expect(submitBtn).toBeDisabled();

    // Cumple todo: min 8, mayúscula, minúscula, número, símbolo y coinciden
    fireEvent.change(passwordInput, { target: { value: 'Password12!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12!' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('protege contra doble clic y muestra spinner durante la activación (CA-06.8)', async () => {
    let resolveActivation!: (value: unknown) => void;
    const activationPromise = new Promise((resolve) => {
      resolveActivation = resolve;
    });

    (activationService.activateAccount as jest.Mock).mockReturnValue(activationPromise);

    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
        onSuccess={mockOnSuccess}
      />,
    );

    const passwordInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/^verificar contraseña \*/i);

    fireEvent.change(passwordInput, { target: { value: 'Password12!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12!' } });

    const submitBtn = screen.getByRole('button', { name: /^activar cuenta/i });
    fireEvent.click(submitBtn);

    // Segundo clic inmediato para verificar protección anti-doble clic (CA-06.8)
    fireEvent.click(submitBtn);

    expect(activationService.activateAccount).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/activando cuenta\.\.\./i)).toBeTruthy();

    resolveActivation({ activated: true });

    await waitFor(() => {
      expect(screen.getByText(/cuenta activada exitosamente/i)).toBeTruthy();
    });
  });

  it('muestra mensaje de error cuando la llamada de activación falla (CA-06.8)', async () => {
    (activationService.activateAccount as jest.Mock).mockRejectedValueOnce(
      new Error('El pase de activación ha vencido; valida el código otra vez'),
    );

    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
        onBackToOtp={mockOnBackToOtp}
      />,
    );

    const passwordInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/^verificar contraseña \*/i);

    fireEvent.change(passwordInput, { target: { value: 'Password12!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12!' } });

    const submitBtn = screen.getByRole('button', { name: /^activar cuenta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/el pase de activación ha vencido; valida el código otra vez/i),
      ).toBeTruthy();
    });

    const backBtn = screen.getByRole('button', { name: /volver a validar código otp/i });
    fireEvent.click(backBtn);
    expect(mockOnBackToOtp).toHaveBeenCalledTimes(1);
  });

  it('muestra confirmación «Cuenta activada exitosamente» con enlace a /login (CA-06.9)', async () => {
    (activationService.activateAccount as jest.Mock).mockResolvedValueOnce({
      activated: true,
    });

    render(
      <ActivatePasswordStep
        applicationId={testAppId}
        activationToken={validToken}
        onSuccess={mockOnSuccess}
      />,
    );

    const passwordInput = screen.getByLabelText(/^nueva contraseña \*/i);
    const confirmInput = screen.getByLabelText(/^verificar contraseña \*/i);

    fireEvent.change(passwordInput, { target: { value: 'Password12!' } });
    fireEvent.change(confirmInput, { target: { value: 'Password12!' } });

    const submitBtn = screen.getByRole('button', { name: /^activar cuenta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('activation-success-view')).toBeTruthy();
      expect(screen.getByText(/cuenta activada exitosamente/i)).toBeTruthy();
      expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
