import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import { CorrectionTokenService } from './correction-token.service';
import type { CorrectionTokenPort, StoredCorrectionToken } from '../ports/correction-token.port';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

describe('CorrectionTokenService', () => {
  let service: CorrectionTokenService;
  let mockPort: jest.Mocked<CorrectionTokenPort>;
  let configService: ConfigService<Environment, true>;
  let storedTokens: Map<string, StoredCorrectionToken>;

  beforeEach(() => {
    storedTokens = new Map();
    mockPort = {
      saveToken: jest.fn(async (applicationId: string, tokenHash: string, expiresAt: Date) => {
        for (const token of storedTokens.values()) {
          if (token.applicationId === applicationId) {
            token.revoked = true;
          }
        }
        storedTokens.set(tokenHash, {
          id: 'token-1',
          applicationId,
          tokenHash,
          expiresAt,
          used: false,
          revoked: false,
        });
      }),
      findActiveToken: jest.fn(async (tokenHash: string) => storedTokens.get(tokenHash) ?? null),
      revokeByApplication: jest.fn(async (applicationId: string) => {
        for (const token of storedTokens.values()) {
          if (token.applicationId === applicationId) {
            token.revoked = true;
          }
        }
      }),
      getApplicationStatus: jest.fn(async (_applicationId: string) => 'OBSERVED'),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'WEB_BASE_URL') {return 'http://localhost:3001';}
        if (key === 'CORRECTION_LINK_TTL_DAYS') {return 7;}
        return undefined;
      }),
    } as unknown as ConfigService<Environment, true>;

    service = new CorrectionTokenService(mockPort, configService);
  });

  it('emite un enlace completo y guarda el hash del token', async () => {
    const link = await service.issueLink('app-123');

    expect(link).toMatch(/^http:\/\/localhost:3001\/applications\/correct\/[A-Za-z0-9_-]+$/);
    expect(mockPort.saveToken).toHaveBeenCalledWith(
      'app-123',
      expect.any(String),
      expect.any(Date),
    );
  });

  it('emitir un enlace nuevo invalida el anterior', async () => {
    const firstLink = await service.issueLink('app-123');
    const firstToken = firstLink.split('/').pop()!;

    const secondLink = await service.issueLink('app-123');
    const secondToken = secondLink.split('/').pop()!;

    await expect(service.resolve(firstToken)).rejects.toThrow(BusinessRuleError);
    await expect(service.resolve(secondToken)).resolves.toBe('app-123');
  });

  it('rechaza con error generico si el token ha vencido', async () => {
    const link = await service.issueLink('app-123');
    const token = link.split('/').pop()!;

    const tokenHash = service.hashToken(token);
    const stored = storedTokens.get(tokenHash)!;
    stored.expiresAt = new Date(Date.now() - 1000);

    await expect(service.resolve(token)).rejects.toThrow(BusinessRuleError);
  });

  it('rechaza si la solicitud ya no esta en estado Observada', async () => {
    const link = await service.issueLink('app-123');
    const token = link.split('/').pop()!;

    mockPort.getApplicationStatus.mockResolvedValueOnce('APPROVED');

    await expect(service.resolve(token)).rejects.toThrow(BusinessRuleError);
  });

  it('rechaza un token invalido o inexistente', async () => {
    await expect(service.resolve('token-que-no-existe')).rejects.toThrow(BusinessRuleError);
    await expect(service.resolve('')).rejects.toThrow(BusinessRuleError);
  });

  it('revoca todos los enlaces activos de una solicitud', async () => {
    const link = await service.issueLink('app-123');
    const token = link.split('/').pop()!;

    await service.revoke('app-123');

    expect(mockPort.revokeByApplication).toHaveBeenCalledWith('app-123');
    await expect(service.resolve(token)).rejects.toThrow(BusinessRuleError);
  });
});
