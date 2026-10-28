import { ConfigService } from '@nestjs/config';
import { NodeRegistrationSecurity } from './registration-security';

describe('Secretos de registro', () => {
  const security = new NodeRegistrationSecurity(
    new ConfigService({ AUTH_JWT_SECRET: 'secreto-de-pruebas'.repeat(8) }),
  );

  it('separa los hashes por propósito y por registro', () => {
    expect(security.hash('otp', 'registro-a:123456')).not.toBe(
      security.hash('activation', 'registro-a:123456'),
    );
    expect(security.hash('otp', 'registro-a:123456')).not.toBe(
      security.hash('otp', 'registro-b:123456'),
    );
  });

  it('cifra las notificaciones y detecta alteraciones', () => {
    const mail = { to: 'test@example.com', text: 'Código 123456' };
    const first = security.seal(mail);
    expect(first).not.toBe(security.seal(mail));
    expect(first).not.toContain('123456');
    expect(security.open(first)).toEqual(mail);
    const bytes = Buffer.from(first, 'base64url');
    bytes[bytes.length - 1] ^= 1;
    expect(() => security.open(bytes.toString('base64url'))).toThrow();
  });
});
