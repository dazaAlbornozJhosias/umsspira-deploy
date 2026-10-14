import crypto from 'crypto';
import type { ActivationCodeRepository } from '../repositories/activation-code.repository';
import { ActivationCodeService } from './activation-code.service';

describe('ActivationCodeService', () => {
  const save = jest.fn();
  const service = new ActivationCodeService({ save } as unknown as ActivationCodeRepository);
  const originalSecret = process.env.ACTIVATION_CODE_SECRET;

  beforeEach(() => {
    save.mockReset();
    process.env.ACTIVATION_CODE_SECRET = 'secreto-de-prueba';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.ACTIVATION_CODE_SECRET = originalSecret;
  });

  it('devuelve un código de 6 dígitos', async () => {
    await expect(service.issue('solicitud-1')).resolves.toMatch(/^\d{6}$/);
  });

  it('completa con ceros a la izquierda', async () => {
    jest.spyOn(crypto, 'randomInt').mockImplementation((() => 42) as never);
    await expect(service.issue('solicitud-1')).resolves.toBe('000042');
  });

  it('guarda el hash con vigencia de 24 horas y no el código en claro', async () => {
    const code = await service.issue('solicitud-1');

    expect(save).toHaveBeenCalledTimes(1);
    const [requestId, codeHash, ttl] = save.mock.calls[0];
    expect(requestId).toBe('solicitud-1');
    expect(ttl).toBe(86400);
    expect(codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(codeHash).not.toContain(code);
  });

  it('falla con un mensaje claro si falta el secreto', async () => {
    delete process.env.ACTIVATION_CODE_SECRET;
    await expect(service.issue('solicitud-1')).rejects.toThrow('ACTIVATION_CODE_SECRET');
    expect(save).not.toHaveBeenCalled();
  });
});
