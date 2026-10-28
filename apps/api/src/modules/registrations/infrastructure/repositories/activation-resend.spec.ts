import { reserveActivationResend, resendWait } from './activation-resend';
import type { Prisma } from '../../../../generated/prisma/client';

const now = new Date('2026-10-24T20:00:00Z');
function setup(count: number, blocked: Date | null = null) {
  const controlReenvioOtp = {
    findUnique: jest.fn().mockResolvedValue({ generaciones_ciclo: count, bloqueado_hasta: blocked, enfriamiento_hasta: null }),
    upsert: jest.fn().mockResolvedValue({}),
  };
  return { tx: { controlReenvioOtp } as unknown as Prisma.TransactionClient, controlReenvioOtp };
}

describe('reenvíos persistentes de activación', () => {
  it.each([[0, 1, 30], [4, 5, 900], [5, 6, 30], [9, 10, 7200], [10, 1, 30]])(
    'desde %i reenvíos emite el %i y espera %i segundos', async (previous, count, seconds) => {
      const { tx, controlReenvioOtp } = setup(previous);
      await expect(reserveActivationResend(tx, 'id', now)).resolves.toEqual({ resendCount: count, cooldownSeconds: seconds });
      expect(controlReenvioOtp.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ generaciones_ciclo: count }) }));
    },
  );
  it('rechaza nuevos reenvíos durante el bloqueo sin consumir otra emisión', async () => {
    const { tx, controlReenvioOtp } = setup(5, new Date(now.getTime() + 900000));
    await expect(reserveActivationResend(tx, 'id', now)).rejects.toMatchObject({ code: 'ACTIVATION_RESEND_BLOCKED' });
    expect(controlReenvioOtp.upsert).not.toHaveBeenCalled();
  });
  it('resta el tiempo real y conserva el enfriamiento entre navegadores', () => {
    expect(resendWait({ bloqueado_hasta: null, enfriamiento_hasta: new Date(now.getTime() + 30000) }, now)).toBe(30);
    expect(resendWait({ bloqueado_hasta: new Date(now.getTime() - 1), enfriamiento_hasta: null }, now)).toBe(0);
  });
});
