import { randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { validateDocument } from '../../domain/policies/document.policy';
import type {
  ObservedApplicationDetail,
  ReplaceObservedDocumentResponse,
  SubmitCorrectionResponse,
  UpdateObservedDataResponse,
} from '../../domain/entities/observed-application';
import type { ObservedApplicationPort } from '../../application/ports/observed-application.port';
import type {
  SubmitCorrectionUseCaseInput,
  UpdateObservedDataUseCaseInput,
  UploadedDocument,
} from '../../application/contracts/registration-inputs';

@Injectable()
export class PrismaObservedApplicationRepository implements ObservedApplicationPort {
  constructor(private readonly prisma: PrismaService) {}

  async getObservedApplication(applicationId: string): Promise<ObservedApplicationDetail> {
    const row = await this.prisma.solicitud.findUnique({
      where: { id: applicationId },
      include: {
        detalle_solicitud: true,
        documento_respaldo: {
          include: { tipo_archivo: true },
        },
        dictamen_registros: {
          orderBy: { fecha_creacion: 'desc' },
          take: 1,
        },
        version_registros: true,
      },
    });

    if (!row || (row.estado !== 'OBSERVED' && row.estado !== 'OBSERVADA')) {
      throw new BusinessRuleError(
        'missing',
        'APPLICATION_NOT_FOUND',
        'La solicitud no existe o no está disponible',
      );
    }

    const currentVersion = row.version_registros.length + 1;

    let docInfo = null;
    if (row.documento_respaldo) {
      const storedFile = row.documento_respaldo.ruta_storage
        ? await this.prisma.archivoRegistro.findFirst({
            where: { id: row.documento_respaldo.ruta_storage },
          })
        : null;

      docInfo = {
        id: row.documento_respaldo.id,
        nombre: storedFile?.nombre ?? 'documento_respaldo',
        tipoDocumento:
          storedFile?.tipo_documento ??
          row.documento_respaldo.tipo_archivo?.nombre ??
          'respaldo',
        mime: storedFile?.mime ?? 'application/pdf',
        sizeBytes:
          storedFile?.size_bytes ??
          (row.documento_respaldo.tamanio_mb ?? 1) * 1024 * 1024,
      };
    }

    const latestReview = row.dictamen_registros[0];
    const observacion = {
      categoria: latestReview?.categoria ?? null,
      justificacion: latestReview?.justificacion ?? null,
      fecha: latestReview?.fecha_creacion?.toISOString() ?? null,
    };

    const d = row.detalle_solicitud;
    return {
      id: row.id,
      version: currentVersion,
      nombres: d?.nombre ?? '',
      apellidos: d?.apellido ?? '',
      ci: d?.ci ?? '',
      complementoCi: d?.extension_ci ?? undefined,
      expedidoEn: d?.expedido_en ? String(d.expedido_en) : '',
      codigoSis: d?.cod_sis ? String(d.cod_sis) : '',
      correo: d?.email ?? '',
      telefono: d?.telefono ?? '',
      carreraId: d?.id_carrera ?? '',
      anioEgreso: d?.anio_egreso ?? 0,
      deseaMentor: d?.desea_mentor ?? false,
      fechaTitulacion: d?.fecha_titulacion
        ? d.fecha_titulacion.toISOString().slice(0, 10)
        : null,
      fechaIngreso: d?.fecha_ingreso
        ? d.fecha_ingreso.toISOString().slice(0, 10)
        : null,
      observacion,
      documento: docInfo,
    };
  }

  async updateObservedApplication(
    applicationId: string,
    input: UpdateObservedDataUseCaseInput,
  ): Promise<UpdateObservedDataResponse> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${applicationId}::uuid FOR UPDATE`;

        const row = await tx.solicitud.findUnique({
          where: { id: applicationId },
          include: {
            detalle_solicitud: true,
            version_registros: true,
          },
        });

        if (!row || (row.estado !== 'OBSERVED' && row.estado !== 'OBSERVADA')) {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está disponible',
          );
        }

        const currentVersion = row.version_registros.length + 1;
        if (input.expectedVersion !== currentVersion) {
          throw new BusinessRuleError(
            'conflict',
            'VERSION_CONFLICT',
            'La solicitud cambió; actualiza antes de guardar',
          );
        }

        const previousEmail = (row.detalle_solicitud?.email ?? '').trim().toLowerCase();
        const newEmail = input.correo.trim().toLowerCase();
        const emailChanged = previousEmail !== newEmail;

        const snapshot = {
          nombre: row.detalle_solicitud?.nombre ?? null,
          apellido: row.detalle_solicitud?.apellido ?? null,
          email: row.detalle_solicitud?.email ?? null,
          telefono: row.detalle_solicitud?.telefono ?? null,
          id_carrera: row.detalle_solicitud?.id_carrera ?? null,
          anio_egreso: row.detalle_solicitud?.anio_egreso ?? null,
          desea_mentor: row.detalle_solicitud?.desea_mentor ?? null,
          fecha_titulacion: row.detalle_solicitud?.fecha_titulacion?.toISOString() ?? null,
          fecha_ingreso: row.detalle_solicitud?.fecha_ingreso?.toISOString() ?? null,
          ci: row.detalle_solicitud?.ci ?? null,
          extension_ci: row.detalle_solicitud?.extension_ci ?? null,
          expedido_en: row.detalle_solicitud?.expedido_en ?? null,
          cod_sis: row.detalle_solicitud?.cod_sis
            ? String(row.detalle_solicitud.cod_sis)
            : null,
        };

        await tx.solicitudVersion.create({
          data: {
            id_solicitud: applicationId,
            numero_version: currentVersion,
            snapshot_detalle: snapshot,
            id_documento_respaldo: row.id_documento_respaldo,
          },
        });

        if (row.id_detalle_solicitud) {
          await tx.detalleSolicitud.update({
            where: { id: row.id_detalle_solicitud },
            data: {
              nombre: input.nombres,
              apellido: input.apellidos,
              email: newEmail,
              telefono: input.telefono,
              id_carrera: input.carreraId,
              anio_egreso: input.anioEgreso,
              desea_mentor: input.deseaMentor ?? false,
              fecha_titulacion: input.fechaTitulacion
                ? new Date(input.fechaTitulacion)
                : null,
              fecha_ingreso: input.fechaIngreso
                ? new Date(input.fechaIngreso)
                : null,
            },
          });
        }

        await tx.solicitud.update({
          where: { id: applicationId },
          data: {
            fecha_actualizacion: new Date(),
          },
        });

        const draft = await tx.borradorRegistro.findUnique({
          where: { id_solicitud: applicationId },
        });

        if (draft) {
          await tx.borradorRegistro.update({
            where: { id: draft.id },
            data: {
              correo_verificado: emailChanged ? false : draft.correo_verificado,
              codigo_hash: emailChanged ? null : draft.codigo_hash,
            },
          });
        }

        const nextVersion = currentVersion + 1;
        return {
          id: applicationId,
          version: nextVersion,
          requiresEmailVerification: emailChanged,
          message: emailChanged
            ? 'Datos actualizados. Debe verificar su nueva dirección de correo electrónico.'
            : 'Datos actualizados correctamente',
        };
      },
      { timeout: 15000 },
    );
  }
  async replaceDocument(
    applicationId: string,
    file: UploadedDocument,
    documentType?: string,
  ): Promise<ReplaceObservedDocumentResponse> {
    if (!file || !file.buffer) {
      throw new BusinessRuleError(
        'invalid',
        'DOCUMENT_REQUIRED',
        'Adjunta un documento de respaldo',
      );
    }

    const mime = validateDocument(file.originalname, file.buffer);

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${applicationId}::uuid FOR UPDATE`;

        const row = await tx.solicitud.findUnique({
          where: { id: applicationId },
          include: {
            documento_respaldo: true,
          },
        });

        if (!row || (row.estado !== 'OBSERVED' && row.estado !== 'OBSERVADA')) {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está disponible',
          );
        }

        if (row.id_documento_respaldo) {
          await tx.documentoRespaldo.update({
            where: { id: row.id_documento_respaldo },
            data: { es_valido: false },
          });
        }

        const cleanName = file.originalname
          .replaceAll('\\', '/')
          .split('/')
          .pop()!
          .replace(/[\x00-\x1f\x7f]/g, '')
          .slice(0, 255);

        const draftHolder = await tx.borradorRegistro.create({
          data: {
            token_hash: randomBytes(32).toString('hex'),
            datos: {},
            expira_en: new Date(Date.now() + 3650 * 24 * 3600 * 1000),
            correo_verificado: true,
          },
        });

        const fileId = randomUUID();

        const newArchivo = await tx.archivoRegistro.create({
          data: {
            id: fileId,
            id_borrador: draftHolder.id,
            tipo_documento: documentType ?? 'DOCUMENTO_IDENTIDAD',
            nombre: cleanName,
            mime,
            contenido: new Uint8Array(file.buffer),
            size_bytes: file.buffer.length,
          },
        });

        const newDoc = await tx.documentoRespaldo.create({
          data: {
            ruta_storage: newArchivo.id,
            tamanio_mb: Math.ceil(file.buffer.length / 1048576),
            fecha_creacion: new Date(),
            es_valido: true,
          },
        });

        await tx.solicitud.update({
          where: { id: applicationId },
          data: {
            id_documento_respaldo: newDoc.id,
            fecha_actualizacion: new Date(),
          },
        });

        return {
          id: applicationId,
          documentoId: newDoc.id,
          nombre: cleanName,
          tipoDocumento: documentType ?? 'DOCUMENTO_IDENTIDAD',
          sizeBytes: file.buffer.length,
          message: 'Documento de respaldo reemplazado correctamente',
        };
      },
      { timeout: 15000 },
    );
  }
  async submitCorrection(
    applicationId: string,
    input: SubmitCorrectionUseCaseInput,
  ): Promise<SubmitCorrectionResponse> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${applicationId}::uuid FOR UPDATE`;

        const row = await tx.solicitud.findUnique({
          where: { id: applicationId },
          include: {
            detalle_solicitud: true,
            version_registros: true,
          },
        });

        if (!row) {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está disponible',
          );
        }

        if (row.estado === 'PENDING' || row.estado === 'PENDIENTE') {
          return {
            id: applicationId,
            estado: row.estado,
            version: row.version_registros.length + 1,
            message: 'La corrección ya fue enviada y se encuentra pendiente de revisión',
          };
        }

        if (row.estado !== 'OBSERVED' && row.estado !== 'OBSERVADA') {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está disponible',
          );
        }

        const currentVersion = row.version_registros.length + 1;
        if (input.expectedVersion !== currentVersion) {
          throw new BusinessRuleError(
            'conflict',
            'VERSION_CONFLICT',
            'La solicitud cambió; actualiza antes de guardar',
          );
        }

        const draft = await tx.borradorRegistro.findUnique({
          where: { id_solicitud: applicationId },
        });

        if (draft && !draft.correo_verificado) {
          throw new BusinessRuleError(
            'conflict',
            'EMAIL_NOT_VERIFIED',
            'Debe verificar su correo electrónico antes de entregar la corrección',
          );
        }

        const snapshot = {
          nombre: row.detalle_solicitud?.nombre ?? null,
          apellido: row.detalle_solicitud?.apellido ?? null,
          email: row.detalle_solicitud?.email ?? null,
          telefono: row.detalle_solicitud?.telefono ?? null,
          id_carrera: row.detalle_solicitud?.id_carrera ?? null,
          anio_egreso: row.detalle_solicitud?.anio_egreso ?? null,
          desea_mentor: row.detalle_solicitud?.desea_mentor ?? null,
          fecha_titulacion: row.detalle_solicitud?.fecha_titulacion?.toISOString() ?? null,
          fecha_ingreso: row.detalle_solicitud?.fecha_ingreso?.toISOString() ?? null,
          ci: row.detalle_solicitud?.ci ?? null,
          extension_ci: row.detalle_solicitud?.extension_ci ?? null,
          expedido_en: row.detalle_solicitud?.expedido_en ?? null,
          cod_sis: row.detalle_solicitud?.cod_sis
            ? String(row.detalle_solicitud.cod_sis)
            : null,
        };

        await tx.solicitudVersion.create({
          data: {
            id_solicitud: applicationId,
            numero_version: currentVersion,
            snapshot_detalle: snapshot,
            id_documento_respaldo: row.id_documento_respaldo,
          },
        });

        await tx.solicitud.update({
          where: { id: applicationId },
          data: {
            estado: 'PENDIENTE',
            fecha_actualizacion: new Date(),
          },
        });

        await tx.tokenSubsanacion.updateMany({
          where: {
            id_solicitud: applicationId,
            usado: false,
          },
          data: {
            usado: true,
          },
        });

        return {
          id: applicationId,
          estado: 'PENDIENTE',
          version: currentVersion + 1,
          message: 'Corrección entregada exitosamente',
        };
      },
      { timeout: 15000 },
    );
  }
}
