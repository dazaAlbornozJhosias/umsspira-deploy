import { useEmailVerificationStore } from './email-verification.store';
import { useRegistrationStore } from '@/modules/registration/frontend/store';

describe('Reverificación del correo editado con el servicio HTTP real', () => {
  beforeEach(() => {
    useRegistrationStore.getState().reset();
    useEmailVerificationStore.getState().reset();
    useEmailVerificationStore.getState().setSessionToken('token');
    useEmailVerificationStore.getState().setEmail('anterior@example.com');
    global.fetch = jest.fn();
  });

  it('limpia el éxito anterior, envía la dirección nueva y solo la confirma tras el OTP', async () => {
    useEmailVerificationStore.setState({ isVerified: true });
    useRegistrationStore.getState().setVerifiedEmail('anterior@example.com');
    useEmailVerificationStore.getState().setEmail('nuevo@example.com');
    expect(useEmailVerificationStore.getState().isVerified).toBe(false);
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ data: { expiresInSeconds: 600 } }) });
    await useEmailVerificationStore.getState().resendCode();
    expect(fetch).toHaveBeenCalledWith('/api/v1/email-verification/resend', expect.objectContaining({ body: JSON.stringify({ registrationId: 'token', email: 'nuevo@example.com' }) }));
    expect(useRegistrationStore.getState().verifiedEmail).toBe('anterior@example.com');
    useEmailVerificationStore.getState().setFullOtp('123456');
    await useEmailVerificationStore.getState().verifyCode();
    expect(useRegistrationStore.getState().verifiedEmail).toBe('nuevo@example.com');
    useEmailVerificationStore.getState().setEmail('nuevo@example.com');
    expect(useEmailVerificationStore.getState().isVerified).toBe(true);
  });

  it('un error de red no verifica el nuevo correo', async () => {
    useEmailVerificationStore.getState().setEmail('nuevo@example.com');
    useEmailVerificationStore.getState().setFullOtp('123456');
    (fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(useEmailVerificationStore.getState().verifyCode()).resolves.toBe(false);
    expect(useRegistrationStore.getState().verifiedEmail).toBeNull();
    expect(useEmailVerificationStore.getState().isVerified).toBe(false);
  });
});
