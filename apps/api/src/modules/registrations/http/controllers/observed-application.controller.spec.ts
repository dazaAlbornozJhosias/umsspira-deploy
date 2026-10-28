import { ObservedApplicationController } from './observed-application.controller';
import type { ObservedApplicationService } from '../../application/services/observed-application.service';
import { updateObservedDataSchema } from '../schemas/registrations.schemas';

describe('ObservedApplicationController', () => {
  let controller: ObservedApplicationController;
  let service: jest.Mocked<ObservedApplicationService>;

  beforeEach(() => {
    service = {
      getObservedApplication: jest.fn(),
      updateObservedApplication: jest.fn(),
    } as unknown as jest.Mocked<ObservedApplicationService>;

    controller = new ObservedApplicationController(service);
  });

  describe('GET /registrations/observed', () => {
    it('obtiene el detalle del expediente observado correctamente', async () => {
      const mockResult = {
        id: 'app-123',
        version: 1,
        nombres: 'Carlos',
        apellidos: 'Montano',
        ci: '1234567',
        expedidoEn: 'CB',
        codigoSis: '202012345',
        correo: 'carlos@example.com',
        telefono: '77777777',
        carreraId: '123e4567-e89b-12d3-a456-426614174000',
        anioEgreso: 2024,
        deseaMentor: true,
        observacion: {
          categoria: 'documento_ilegible',
          justificacion: 'Documento borroso',
          fecha: '2026-10-20T10:00:00Z',
        },
        documento: null,
      };

      service.getObservedApplication.mockResolvedValueOnce(mockResult);

      const response = await controller.getDetail('app-123');

      expect(service.getObservedApplication).toHaveBeenCalledWith('app-123');
      expect(response).toEqual({ data: mockResult });
    });
  });

  describe('PATCH /registrations/observed', () => {
    const validBody = {
      expectedVersion: 1,
      nombres: 'Carlos Alberto',
      apellidos: 'Montano Diaz',
      correo: 'carlos.nuevo@example.com',
      telefono: '78888888',
      carreraId: '123e4567-e89b-12d3-a456-426614174000',
      anioEgreso: 2024,
      deseaMentor: true,
      fechaTitulacion: '2024-05-10',
      fechaIngreso: '2019-02-15',
    };

    it('valida el esquema correctamente con datos validos', () => {
      const parsed = updateObservedDataSchema.parse(validBody);
      expect(parsed.nombres).toBe('Carlos Alberto');
      expect(parsed.expectedVersion).toBe(1);
    });

    it('rechaza fecha de titulacion futura', () => {
      expect(() =>
        updateObservedDataSchema.parse({
          ...validBody,
          fechaTitulacion: '2099-01-01',
        }),
      ).toThrow();
    });

    it('rechaza fecha de ingreso posterior a titulacion', () => {
      expect(() =>
        updateObservedDataSchema.parse({
          ...validBody,
          fechaIngreso: '2024-06-01',
          fechaTitulacion: '2024-05-10',
        }),
      ).toThrow();
    });

    it('ejecuta la actualizacion y retorna el resultado', async () => {
      const mockResult = {
        id: 'app-123',
        version: 2,
        requiresEmailVerification: true,
        message: 'Datos actualizados. Debe verificar su nueva dirección de correo electrónico.',
      };

      service.updateObservedApplication.mockResolvedValueOnce(mockResult);

      const response = await controller.updateData('app-123', validBody);

      expect(service.updateObservedApplication).toHaveBeenCalledWith(
        'app-123',
        validBody,
      );
      expect(response).toEqual({ data: mockResult });
    });
  });
});
