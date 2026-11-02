import {
  RECOVERY_LINK_MINUTES,
  recoveryExpiry,
  recoveryLinkState,
} from './password-recovery.policy';

const NOW = new Date('2026-10-26T15:00:00Z');
const minutes = (value: number) => new Date(NOW.getTime() + value * 60_000);

describe('password-recovery.policy', () => {
  it('el enlace vence a los 60 minutos (CA-12.3)', () => {
    expect(RECOVERY_LINK_MINUTES).toBe(60);
    expect(recoveryExpiry(NOW).toISOString()).toBe('2026-10-26T16:00:00.000Z');
  });

  it('un enlace vigente, sin usar ni revocar, es válido', () => {
    expect(recoveryLinkState({ expiresAt: minutes(30), usedAt: null, revoked: false }, NOW)).toBe('valid');
  });

  it('un enlace vence exactamente en su fecha de expiración', () => {
    expect(recoveryLinkState({ expiresAt: minutes(0), usedAt: null, revoked: false }, NOW)).toBe('expired');
    expect(recoveryLinkState({ expiresAt: minutes(-1), usedAt: null, revoked: false }, NOW)).toBe('expired');
  });

  it('un enlace ya usado se informa como usado aunque también haya vencido (CA-12.5)', () => {
    expect(recoveryLinkState({ expiresAt: minutes(-10), usedAt: minutes(-20), revoked: false }, NOW)).toBe('used');
  });

  it('un enlace reemplazado por uno más reciente se informa como revocado', () => {
    expect(recoveryLinkState({ expiresAt: minutes(30), usedAt: null, revoked: true }, NOW)).toBe('revoked');
  });
});