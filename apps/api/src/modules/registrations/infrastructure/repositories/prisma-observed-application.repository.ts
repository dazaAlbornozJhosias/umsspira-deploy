import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type {
  ObservedApplicationDetail,
  UpdateObservedDataResponse,
} from '../../domain/entities/observed-application';
import type { ObservedApplicationPort } from '../../application/ports/observed-application.port';
import type { UpdateObservedDataUseCaseInput } from '../../application/contracts/registration-inputs';

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
}
