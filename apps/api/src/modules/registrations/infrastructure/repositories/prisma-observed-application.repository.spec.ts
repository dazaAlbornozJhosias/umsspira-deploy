import type { UploadedDocument } from '../../application/contracts/registration-inputs';
import { PrismaObservedApplicationRepository } from './prisma-observed-application.repository';
import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';

jest.mock('../../../../shared/infrastructure/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('PrismaObservedApplicationRepository', () => {
  const applicationId = 'app-123';

  const mockDetail = {
    id: 'detail-1',
    nombre: 'Carlos',
    apellido: 'Montano',
    ci: '1234567',
    extension_ci: 'CB',
    expedido_en: 'CB',
    cod_sis: '202012345',
    email: 'carlos@example.com',
    telefono: '77777777',
    id_carrera: 'career-1',
    anio_egreso: 2024,
    desea_mentor: true,
    fecha_titulacion: new Date('2024-05-10T00:00:00Z'),
    fecha_ingreso: new Date('2019-02-15T00:00:00Z'),
  };

  const mockReview = {
    categoria: 'documento_ilegible',
    justificacion: 'El diploma adjunto no se puede leer con claridad',
    fecha_creacion: new Date('2026-10-20T10:00:00Z'),
  };

  const mockDocument = {
    id: 'doc-1',
    ruta_storage: 'file-123',
    tamanio_mb: 2,
    tipo_archivo: { nombre: 'diploma_academico' },
  };

  const mockFile = {
    id: 'file-123',
    nombre: 'diploma.pdf',
    tipo_documento: 'diploma_academico',
    mime: 'application/pdf',
    size_bytes: 2097152,
  };

  function createRepo(overrides: {
    application?: unknown;
    storedFile?: unknown;
    txApplication?: unknown;
    draft?: unknown;
  }) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      solicitud: {
        findUnique: jest.fn().mockResolvedValue(overrides.txApplication ?? overrides.application),
        update: jest.fn().mockResolvedValue({ id: applicationId }),
      },
      solicitudVersion: {
        create: jest.fn().mockResolvedValue({ id: 'ver-1' }),
      },
      detalleSolicitud: {
        update: jest.fn().mockResolvedValue({ id: 'detail-1' }),
      },
      borradorRegistro: {
        findUnique: jest.fn().mockResolvedValue(overrides.draft ?? { id: 'draft-1', correo_verificado: true }),
        create: jest.fn().mockResolvedValue({ id: 'draft-holder-1' }),
        update: jest.fn().mockResolvedValue({ id: 'draft-1' }),
      },
      archivoRegistro: {
        create: jest.fn().mockResolvedValue({ id: 'arch-1' }),
      },
      documentoRespaldo: {
        update: jest.fn().mockResolvedValue({ id: 'doc-1' }),
        create: jest.fn().mockResolvedValue({ id: 'new-doc-1' }),
      },
      tokenSubsanacion: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (txArg: typeof tx) => unknown) => callback(tx)),
      solicitud: {
        findUnique: jest.fn().mockResolvedValue(overrides.application),
      },
      archivoRegistro: {
        findFirst: jest.fn().mockResolvedValue(overrides.storedFile ?? mockFile),
      },
    };

    return {
      prisma,
      tx,
      repository: new PrismaObservedApplicationRepository(prisma as unknown as PrismaService),
    };
  }

  describe('getObservedApplication', () => {
    it('retorna el detalle de la solicitud observada con version y observacion', async () => {
      const { repository } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          detalle_solicitud: mockDetail,
          documento_respaldo: mockDocument,
          dictamen_registros: [mockReview],
          version_registros: [{ id: 'v1' }],
        },
      });

      const result = await repository.getObservedApplication(applicationId);

      expect(result.id).toBe(applicationId);
      expect(result.version).toBe(2);
      expect(result.nombres).toBe('Carlos');
      expect(result.observacion.categoria).toBe('documento_ilegible');
      expect(result.documento?.nombre).toBe('diploma.pdf');
      expect((result.documento as unknown as Record<string, unknown>).ruta_storage).toBeUndefined();
    });

    it('acepta la solicitud tanto en estado OBSERVED como OBSERVADA', async () => {
      for (const estado of ['OBSERVED', 'OBSERVADA']) {
        const { repository } = createRepo({
          application: {
            id: applicationId,
            estado,
            detalle_solicitud: mockDetail,
            documento_respaldo: mockDocument,
            dictamen_registros: [mockReview],
            version_registros: [],
          },
        });

        const result = await repository.getObservedApplication(applicationId);
        expect(result.id).toBe(applicationId);
      }
    });

    it('lanza 404 generico si la solicitud no existe', async () => {
      const { repository } = createRepo({ application: null });

      await expect(repository.getObservedApplication(applicationId)).rejects.toMatchObject({
        code: 'APPLICATION_NOT_FOUND',
        reason: 'missing',
      });
    });

    it('lanza 404 generico si la solicitud no esta en estado OBSERVED u OBSERVADA', async () => {
      for (const estado of ['PENDING', 'APPROVED', 'REJECTED', 'PENDIENTE', 'APROBADA', 'RECHAZADA']) {
        const { repository } = createRepo({
          application: {
            id: applicationId,
            estado,
            detalle_solicitud: mockDetail,
            version_registros: [],
            dictamen_registros: [],
          },
        });

        await expect(repository.getObservedApplication(applicationId)).rejects.toMatchObject({
          code: 'APPLICATION_NOT_FOUND',
          reason: 'missing',
        });
      }
    });
  });

  describe('updateObservedApplication', () => {
    const updateInput = {
      expectedVersion: 1,
      nombres: 'Carlos Alberto',
      apellidos: 'Montano Diaz',
      correo: 'carlos@example.com',
      telefono: '78888888',
      carreraId: 'career-1',
      anioEgreso: 2024,
      deseaMentor: true,
      fechaTitulacion: '2024-05-10',
      fechaIngreso: '2019-02-15',
    };

    it('actualiza datos y crea snapshot de version cuando expectedVersion coincide', async () => {
      const { repository, tx } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          id_detalle_solicitud: 'detail-1',
          id_documento_respaldo: 'doc-1',
          detalle_solicitud: mockDetail,
          version_registros: [],
        },
      });

      const response = await repository.updateObservedApplication(applicationId, updateInput);

      expect(response.version).toBe(2);
      expect(response.requiresEmailVerification).toBe(false);
      expect(tx.solicitudVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_solicitud: applicationId,
          numero_version: 1,
          snapshot_detalle: expect.objectContaining({ nombre: 'Carlos' }),
        }),
      });
      expect(tx.detalleSolicitud.update).toHaveBeenCalledWith({
        where: { id: 'detail-1' },
        data: expect.objectContaining({ nombre: 'Carlos Alberto', telefono: '78888888' }),
      });
    });

    it('permite actualizar tanto en estado OBSERVED como OBSERVADA', async () => {
      for (const estado of ['OBSERVED', 'OBSERVADA']) {
        const { repository } = createRepo({
          application: {
            id: applicationId,
            estado,
            id_detalle_solicitud: 'detail-1',
            id_documento_respaldo: 'doc-1',
            detalle_solicitud: mockDetail,
            version_registros: [],
          },
        });

        const response = await repository.updateObservedApplication(applicationId, updateInput);
        expect(response.version).toBe(2);
      }
    });

    it('lanza 409 VERSION_CONFLICT cuando expectedVersion no coincide', async () => {
      const { repository } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          detalle_solicitud: mockDetail,
          version_registros: [{ id: 'v1' }],
        },
      });

      await expect(
        repository.updateObservedApplication(applicationId, {
          ...updateInput,
          expectedVersion: 1, // La actual es 2
        }),
      ).rejects.toMatchObject({
        code: 'VERSION_CONFLICT',
        message: 'La solicitud cambió; actualiza antes de guardar',
      });
    });

    it('lanza 404 generico si la solicitud paso a REJECTED, APPROVED o PENDING', async () => {
      for (const estado of ['REJECTED', 'APPROVED', 'PENDING', 'RECHAZADA', 'APROBADA', 'PENDIENTE']) {
        const { repository } = createRepo({
          application: {
            id: applicationId,
            estado,
            detalle_solicitud: mockDetail,
            version_registros: [],
          },
        });

        await expect(
          repository.updateObservedApplication(applicationId, updateInput),
        ).rejects.toMatchObject({
          code: 'APPLICATION_NOT_FOUND',
        });
      }
    });

    it('requiere reverificacion cuando el correo cambia', async () => {
      const { repository, tx } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          id_detalle_solicitud: 'detail-1',
          detalle_solicitud: mockDetail,
          version_registros: [],
        },
        draft: { id: 'draft-1', correo_verificado: true },
      });

      const response = await repository.updateObservedApplication(applicationId, {
        ...updateInput,
        correo: 'nuevo_correo@example.com',
      });

      expect(response.requiresEmailVerification).toBe(true);
      expect(tx.borradorRegistro.update).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
        data: expect.objectContaining({
          correo_verificado: false,
          codigo_hash: null,
        }),
      });
    });
  });
  describe('replaceDocument', () => {
    const validPdfBuffer = Buffer.from('%PDF-1.4 test document content');
    const mockFile: UploadedDocument = {
      originalname: 'titulo_actualizado.pdf',
      buffer: validPdfBuffer,
      size: validPdfBuffer.length,
    };

    it('reemplaza el documento marcando el anterior como no valido y conservandolo en historial', async () => {
      const { repository, tx } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          id_documento_respaldo: 'old-doc-1',
        },
      });

      const response = await repository.replaceDocument(applicationId, mockFile, 'diploma_academico');

      expect(tx.documentoRespaldo.update).toHaveBeenCalledWith({
        where: { id: 'old-doc-1' },
        data: { es_valido: false },
      });
      expect(tx.archivoRegistro.create).toHaveBeenCalled();
      expect(tx.documentoRespaldo.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ es_valido: true }),
      }));
      expect(tx.solicitud.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: applicationId },
      }));
      expect(response.documentoId).toBe('new-doc-1');
      expect(response.nombre).toBe('titulo_actualizado.pdf');
    });

    it('permite reemplazar documento tanto en estado OBSERVED como OBSERVADA', async () => {
      for (const estado of ['OBSERVED', 'OBSERVADA']) {
        const { repository } = createRepo({
          application: {
            id: applicationId,
            estado,
            id_documento_respaldo: 'old-doc-1',
          },
        });
        const response = await repository.replaceDocument(applicationId, mockFile);
        expect(response.documentoId).toBe('new-doc-1');
      }
    });

    it('lanza error si el archivo no esta presente', async () => {
      const { repository } = createRepo({
        application: { id: applicationId, estado: 'OBSERVED' },
      });

      await expect(repository.replaceDocument(applicationId, null as unknown as UploadedDocument)).rejects.toMatchObject({
        code: 'DOCUMENT_REQUIRED',
      });
    });

    it('lanza 404 generico si la solicitud no esta en estado observada', async () => {
      const { repository } = createRepo({
        application: { id: applicationId, estado: 'APPROVED' },
      });

      await expect(repository.replaceDocument(applicationId, mockFile)).rejects.toMatchObject({
        code: 'APPLICATION_NOT_FOUND',
      });
    });
  });

  describe('submitCorrection', () => {
    it('entrega la correccion, crea snapshot en version, cambia a PENDIENTE e invalida el token', async () => {
      const { repository, tx } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          detalle_solicitud: mockDetail,
          id_documento_respaldo: 'doc-1',
          version_registros: [{ id: 'v1' }],
        },
        draft: { id: 'draft-1', correo_verificado: true },
      });

      const response = await repository.submitCorrection(applicationId, { expectedVersion: 2 });

      expect(response.estado).toBe('PENDIENTE');
      expect(response.version).toBe(3);
      expect(tx.solicitudVersion.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          id_solicitud: applicationId,
          numero_version: 2,
        }),
      }));
      expect(tx.solicitud.update).toHaveBeenCalledWith({
        where: { id: applicationId },
        data: expect.objectContaining({ estado: 'PENDIENTE' }),
      });
      expect(tx.tokenSubsanacion.updateMany).toHaveBeenCalledWith({
        where: { id_solicitud: applicationId, usado: false },
        data: { usado: true },
      });
    });

    it('es idempotente si la solicitud ya fue entregada a PENDING o PENDIENTE', async () => {
      for (const estado of ['PENDING', 'PENDIENTE']) {
        const { repository, tx } = createRepo({
          application: {
            id: applicationId,
            estado,
            detalle_solicitud: mockDetail,
            version_registros: [{ id: 'v1', numero_version: 1 }],
          },
        });

        const response = await repository.submitCorrection(applicationId, { expectedVersion: 2 });
        expect(response.estado).toBe(estado);
        expect(tx.solicitud.update).not.toHaveBeenCalled();
      }
    });

    it('lanza 409 VERSION_CONFLICT cuando expectedVersion no coincide', async () => {
      const { repository } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          detalle_solicitud: mockDetail,
          version_registros: [{ id: 'v1' }],
        },
      });

      await expect(
        repository.submitCorrection(applicationId, { expectedVersion: 1 }),
      ).rejects.toMatchObject({
        code: 'VERSION_CONFLICT',
      });
    });

    it('lanza 409 EMAIL_NOT_VERIFIED si el correo fue modificado y no se ha verificado', async () => {
      const { repository } = createRepo({
        application: {
          id: applicationId,
          estado: 'OBSERVED',
          detalle_solicitud: mockDetail,
          version_registros: [],
        },
        draft: { id: 'draft-1', correo_verificado: false },
      });

      await expect(
        repository.submitCorrection(applicationId, { expectedVersion: 1 }),
      ).rejects.toMatchObject({
        code: 'EMAIL_NOT_VERIFIED',
      });
    });

    it('lanza 404 generico si la solicitud esta en estado no editable', async () => {
      const { repository } = createRepo({
        application: { id: applicationId, estado: 'APPROVED', version_registros: [] },
      });

      await expect(
        repository.submitCorrection(applicationId, { expectedVersion: 1 }),
      ).rejects.toMatchObject({
        code: 'APPLICATION_NOT_FOUND',
      });
    });
  });
});
