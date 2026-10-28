/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivateView } from './activate-view';
import { activationService } from '@/modules/activation/frontend/services/activation.service';

const applicationId = '12345678-1234-4234-8234-123456789abc';
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/modules/activation/frontend/services/activation.service', () => ({
  ...jest.requireActual('@/modules/activation/frontend/services/activation.service'),
  activationService: {
    inspect: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
    activateAccount: jest.fn(),
  },
}));

describe('ActivateView Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.set('applicationId', applicationId);
    (activationService.inspect as jest.Mock).mockResolvedValue({
      maskedEmail: 'ti****@umss.edu.bo', expiresAt: '2026-10-25T20:00:00Z',
      cooldownSeconds: 0, resendCount: 0, failedAttempts: 0,
    });
  });

  it('inicia en el Paso 1 (OTP) y pasa al Paso 2 (contraseña) tras validar exitosamente (CA-06.3)', async () => {
    (activationService.verifyOtp as jest.Mock).mockResolvedValueOnce({
      activationToken: 'signed-token-step1',
    });

    render(<ActivateView />);

    // Verifica que empieza en el Paso 1
    expect(screen.getByText(/activa tu cuenta de titulado/i)).toBeTruthy();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    await waitFor(() => expect(inputs[0]).toBeEnabled());

    // Ingresar 6 dígitos
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: `${i + 1}` } });
    }

    const nextBtn = screen.getByRole('button', { name: /^siguiente/i });
    fireEvent.click(nextBtn);

    // Debe transicionar a la pantalla 2 (Crear contraseña)
    await waitFor(() => {
      expect(screen.getByText(/paso 2: crear contraseña/i)).toBeTruthy();
      expect(screen.getByLabelText(/^nueva contraseña \*/i)).toBeTruthy();
      expect(screen.getByLabelText(/^verificar contraseña \*/i)).toBeTruthy();
    });
  });

  it('completa el flujo hasta la confirmación de cuenta activada (CA-06.9)', async () => {
    (activationService.verifyOtp as jest.Mock).mockResolvedValueOnce({
      activationToken: 'signed-token-step1',
    });
    (activationService.activateAccount as jest.Mock).mockResolvedValueOnce({
      activated: true,
    });

    render(<ActivateView />);

    const inputs = screen.getAllByRole('textbox');
    await waitFor(() => expect(inputs[0]).toBeEnabled());
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: '1' } });
    }
    fireEvent.click(screen.getByRole('button', { name: /^siguiente/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^nueva contraseña \*/i)).toBeTruthy();
    });

    // Ingresar contraseñas válidas
    fireEvent.change(screen.getByLabelText(/^nueva contraseña \*/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/^verificar contraseña \*/i), {
      target: { value: 'Password123!' },
    });

    const activateBtn = screen.getByRole('button', { name: /^activar cuenta/i });
    expect(activateBtn).not.toBeDisabled();
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(screen.getByText(/cuenta activada exitosamente/i)).toBeTruthy();
      expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });
  });

  it('no muestra el formulario ni consulta el servidor cuando el enlace es inválido', () => {
    mockSearchParams.set('applicationId', 'app-123');
    render(<ActivateView />);
    expect(screen.getByText(/abre el enlace de activación/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(activationService.inspect).not.toHaveBeenCalled();
  });
});
