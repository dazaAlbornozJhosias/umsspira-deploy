import { ActivationService } from './activation.service';

describe('ActivationService', () => {
  const service = new ActivationService();
  it('un endpoint ausente no anuncia un reenvío exitoso', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: { message: 'Ruta inexistente', code: 'NOT_FOUND' } }) });
    await expect(service.resendOtp('id')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
  it('conserva el código de bloqueo devuelto por el servidor', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'Código invalidado', code: 'ACTIVATION_ATTEMPTS_EXCEEDED' } }) });
    await expect(service.verifyOtp('id', '123456')).rejects.toMatchObject({ code: 'ACTIVATION_ATTEMPTS_EXCEEDED' });
  });
  it('consulta el estado usando solo el identificador y sin caché', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { maskedEmail: 'ma****@example.com', cooldownSeconds: 7200 } }) });
    await expect(service.inspect('id')).resolves.toMatchObject({ cooldownSeconds: 7200 });
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/registrations/activate/status', expect.objectContaining({ method: 'POST', cache: 'no-store', body: '{"applicationId":"id"}' }));
  });
});
