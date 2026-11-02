import { ObservedApplicationController } from './observed-application.controller';
import type { ObservedApplicationService } from '../../application/services/observed-application.service';
import {
  replaceDocumentSchema,
  submitCorrectionSchema,
  updateObservedDataSchema,
} from '../schemas/registrations.schemas';
import type { UploadedDocument } from '../../application/contracts/registration-inputs';

describe('ObservedApplicationController', () => {
  let controller: ObservedApplicationController;
  let service: jest.Mocked<ObservedApplicationService>;

  beforeEach(() => {
    service = {
      getObservedApplication: jest.fn(),
      updateObservedApplication: jest.fn(),
      replaceDocument: jest.fn(),
      submitCorrection: jest.fn(),
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

  describe('POST /registrations/observed/document', () => {
    it('valida el esquema de reemplazo de documento y restringe longitud a 40', () => {
      const parsed = replaceDocumentSchema.parse({ tipoDocumento: 'diploma_academico' });
      expect(parsed.tipoDocumento).toBe('diploma_academico');

      const maxLimit = replaceDocumentSchema.parse({ tipoDocumento: 'a'.repeat(40) });
      expect(maxLimit.tipoDocumento).toHaveLength(40);

      expect(() =>
        replaceDocumentSchema.parse({ tipoDocumento: 'a'.repeat(41) }),
      ).toThrow();
    });
    it('reemplaza el documento con exito pasando archivo', async () => {
      const mockResult = {
        id: 'app-123',
        documentoId: 'doc-new',
        nombre: 'nuevo.pdf',
        tipoDocumento: 'diploma_academico',
        sizeBytes: 1024,
        message: 'Documento de respaldo reemplazado correctamente',
      };
      service.replaceDocument.mockResolvedValueOnce(mockResult);

      const mockFile = {
        originalname: 'nuevo.pdf',
        buffer: Buffer.from('%PDF-1.4 test'),
        size: 1024,
      } as UploadedDocument;

      const response = await controller.replaceDocument('app-123', [mockFile], {
        tipoDocumento: 'diploma_academico',
      });

      expect(service.replaceDocument).toHaveBeenCalledWith(
        'app-123',
        mockFile,
        'diploma_academico',
      );
      expect(response).toEqual({ data: mockResult });
    });
  });

  describe('POST /registrations/observed/submit', () => {
    it('valida el esquema de entrega correctamente', () => {
      const parsed = submitCorrectionSchema.parse({ expectedVersion: 2 });
      expect(parsed.expectedVersion).toBe(2);
      expect(() => submitCorrectionSchema.parse({ expectedVersion: -1 })).toThrow();
    });

    it('ejecuta la entrega exitosamente y retorna el resultado', async () => {
      const mockResult = {
        id: 'app-123',
        estado: 'PENDIENTE',
        version: 3,
        message: 'Corrección entregada exitosamente',
      };
      service.submitCorrection.mockResolvedValueOnce(mockResult);

      const response = await controller.submitCorrection('app-123', {
        expectedVersion: 2,
      });

      expect(service.submitCorrection).toHaveBeenCalledWith('app-123', {
        expectedVersion: 2,
      });
      expect(response).toEqual({ data: mockResult });
    });
  });
});
