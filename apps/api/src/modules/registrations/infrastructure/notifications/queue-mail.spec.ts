import { mailEventKey, queueTrackedMail } from './queue-mail';

describe('Correo encolado con seguimiento', () => {
  const tx = {
    correoPendiente: { create: jest.fn() },
    correoTramite: { create: jest.fn() },
  };
  const base = {
    encrypted: 'cifrado',
    expiresAt: new Date('2030-01-01T00:00:00Z'),
    applicationId: 'solicitud-1',
    type: 'otp' as const,
    to: 'ana@example.com',
    subject: 'Nuevo código',
  };

  beforeEach(() => jest.clearAllMocks());

  it('enlaza el seguimiento con el correo en cola por la clave del evento', async () => {
    const outboxId = await queueTrackedMail(tx as never, base);
    const queued = tx.correoPendiente.create.mock.calls[0][0].data;
    const tracking = tx.correoTramite.create.mock.calls[0][0].data;
    expect(queued).toMatchObject({ id: outboxId, contenido: 'cifrado' });
    expect(tracking.clave_evento).toBe(mailEventKey(outboxId));
    expect(tracking).toMatchObject({
      id_solicitud: 'solicitud-1',
      tipo: 'otp',
      estado: 'pendiente',
      max_intentos: 3,
      id_dictamen: null,
    });
  });

  it('asocia el dictamen cuando el correo nace de uno', async () => {
    await queueTrackedMail(tx as never, { ...base, type: 'aprobacion', reviewId: 'dictamen-1' });
    expect(tx.correoTramite.create.mock.calls[0][0].data.id_dictamen).toBe('dictamen-1');
  });
});