import { ConfigService } from '@nestjs/config';
import { HmacBackupLinkSigner } from './hmac-backup-link-signer';

describe('Firma de enlaces de respaldo', () => {
  const signer = new HmacBackupLinkSigner(
    new ConfigService({ AUTH_JWT_SECRET: 'secreto-de-pruebas'.repeat(8) }),
  );
  const id = '0b6f1c1e-4f7a-4c55-9a52-1f6f0d3b2a10';

  it('acepta la firma del mismo respaldo y vencimiento', () => {
    expect(signer.verify(id, 1000, signer.sign(id, 1000))).toBe(true);
  });

  it('rechaza la firma de otro respaldo, otro vencimiento o alterada', () => {
    const signature = signer.sign(id, 1000);
    expect(signer.verify('5d2a7c3e-1b4f-4e8a-9c6d-2f7e8a9b0c1d', 1000, signature)).toBe(false);
    expect(signer.verify(id, 2000, signature)).toBe(false);
    expect(signer.verify(id, 1000, signature.slice(0, -1) + 'x')).toBe(false);
    expect(signer.verify(id, 1000, 'corta')).toBe(false);
  });
});
