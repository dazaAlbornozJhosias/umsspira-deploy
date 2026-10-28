import type { ExecutionContext } from '@nestjs/common';
import { ValidateCorrectionAccessController } from './validate-correction-access.controller';
import { RequestCorrectionLinkController } from './request-correction-link.controller';
import { CorrectionTokenGuard } from '../guards/correction-token.guard';
import type { CorrectionTokenService } from '../../application/services/correction-token.service';
import type { RequestCorrectionLinkUseCase } from '../../application/use-cases/request-correction-link.use-case';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { requestCorrectionLinkSchema } from '../schemas/registrations.schemas';

describe('Correction Access & Request Controllers', () => {
  describe('ValidateCorrectionAccessController & CorrectionTokenGuard', () => {
    let controller: ValidateCorrectionAccessController;
    let guard: CorrectionTokenGuard;
    let tokenService: jest.Mocked<CorrectionTokenService>;

    beforeEach(() => {
      tokenService = {
        resolve: jest.fn(),
      } as unknown as jest.Mocked<CorrectionTokenService>;

      guard = new CorrectionTokenGuard(tokenService);
      controller = new ValidateCorrectionAccessController();
    });

    it('permite el acceso con un token valido y devuelve respuesta minima', async () => {
      tokenService.resolve.mockResolvedValueOnce('app-123');

      const mockRequest: Record<string, unknown> = {
        headers: { 'x-correction-token': 'token-valido-123' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(mockRequest.applicationId).toBe('app-123');

      const response = await controller.handle();
      expect(response).toEqual({ data: { valid: true } });
    });

    it('rechaza con 404 si el header X-Correction-Token esta ausente', async () => {
      const mockRequest = { headers: {} };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessRuleError);
    });

    it('rechaza con 404 si el token es invalido o expirado', async () => {
      tokenService.resolve.mockRejectedValueOnce(
        new BusinessRuleError('missing', 'TOKEN_NOT_FOUND', 'El recurso solicitado no existe o no está disponible'),
      );

      const mockRequest = {
        headers: { 'x-correction-token': 'token-expirado' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('RequestCorrectionLinkController', () => {
    let controller: RequestCorrectionLinkController;
    let useCase: jest.Mocked<RequestCorrectionLinkUseCase>;

    beforeEach(() => {
      useCase = {
        execute: jest.fn().mockResolvedValue({
          message:
            'Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado',
        }),
      } as unknown as jest.Mocked<RequestCorrectionLinkUseCase>;

      controller = new RequestCorrectionLinkController(useCase);
    });

    it('valida el esquema de peticion de enlace con C.I. numerico', () => {
      expect(requestCorrectionLinkSchema.parse({ ci: '1234567', expedidoEn: 'CB' })).toBeTruthy();
    });

    it('devuelve mensaje identico e inmediato exista o no la solicitud', async () => {
      const result = await controller.handle({
        ci: '1234567',
        complemento: '',
        expedidoEn: 'CB',
      });

      expect(result).toEqual({
        data: {
          message:
            'Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado',
        },
      });
      expect(useCase.execute).toHaveBeenCalledWith({
        ci: '1234567',
        complemento: '',
        expedidoEn: 'CB',
      });
    });
  });
});
