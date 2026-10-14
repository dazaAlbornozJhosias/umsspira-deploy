import { submitRegistration } from './document.service';

describe('submitRegistration', () => {
  const params = {
    sessionToken: '22222222-2222-4222-8222-222222222222',
    tipoDocumento: 'titulo_provision_nacional' as const,
    rutaStorage: 'solicitudes/x/y.pdf',
    sizeBytes: 2048,
    mimeType: 'application/pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra la solicitud y devuelve el identificador y el estado (CA-03.2)', async () => {
    const submission = { idSolicitud: '11111111-1111-4111-8111-111111111111', estado: 'Pendiente', mensaje: 'Solicitud registrada correctamente' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: submission }) });

    const result = await submitRegistration(params);

    expect(result).toEqual({ ok: true, submission });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/registrations/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toEqual({ ...params, deseaMentor: false });
  });

  it('propaga el vencimiento de la sesión con su mensaje (CA-01.6)', async () => {
    const message = 'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 410, json: async () => ({ statusCode: 410, message }) });

    const result = await submitRegistration(params);

    expect(result).toEqual({ ok: false, status: 410, code: undefined, message, errors: [] });
  });

  it('propaga el duplicado detectado al enviar (CA-03.6)', async () => {
    const message = 'Este correo electrónico ya está registrado en otra solicitud';
    const errors = [{ field: 'correo', message }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ statusCode: 409, message, field: 'correo', errors }),
    });

    const result = await submitRegistration(params);

    expect(result).toEqual({ ok: false, status: 409, code: undefined, message, errors });
  });

  it('avisa cuando no hay conexión con el servidor', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    const result = await submitRegistration(params);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(0);
      expect(result.message).toMatch(/conectar/);
    }
  });
});
