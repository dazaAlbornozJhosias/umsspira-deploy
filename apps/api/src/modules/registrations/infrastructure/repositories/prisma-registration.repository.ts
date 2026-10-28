import { Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { RegistrationRepository } from '../../application/ports/registration-repository.port';
import type { RegistrationData, RegistrationFile } from '../../domain/entities/registration';
import type { SubmitRegistrationInput } from '../../application/contracts/registration-inputs';
import { CODE_SECONDS, RESEND_SECONDS, assertVerifiedDraft } from '../../domain/policies/registration.policy';
import { toRegistrationFile, toRegistrationDraft } from '../translators/registration.translator';
import { assertNoDuplicate, lockDraft, lockDraftForSubmission } from './registration-transactions';
import { assertSameSubmission } from '../../domain/policies/registration-submission.policy';

@Injectable()
export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listCareers() {
    return this.prisma.carrera.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async createDraft(tokenHash: string, data: RegistrationData, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        if (
          !(await tx.carrera.findUnique({ where: { id: data.carreraId }, select: { id: true } }))
        ) {
          throw new BusinessRuleError('invalid', 'INVALID_CAREER', 'La carrera no existe');
        }
        await assertNoDuplicate(tx, data);
        await tx.borradorRegistro.create({
          data: { token_hash: tokenHash, datos: { ...data }, expira_en: expiresAt },
        });
      },
      { timeout: 15000 },
    );
  }

  async updateDraft(tokenHash: string, data: RegistrationData) {
    return this.prisma.$transaction(
      async (tx) => {
        const { row, draft } = await lockDraft(tx, tokenHash);
        if (
          !(await tx.carrera.findUnique({ where: { id: data.carreraId }, select: { id: true } }))
        ) {
          throw new BusinessRuleError('invalid', 'INVALID_CAREER', 'La carrera no existe');
        }
        await assertNoDuplicate(tx, data);
        // Metadata interna del JSON: nunca se acepta desde el formulario público.
        // Permite cancelar un cambio y recuperar el último correo probado por OTP.
        const stored = row.datos as unknown as RegistrationData & { verifiedEmail?: string };
        const verifiedEmail = row.correo_verificado
          ? draft.data.correo
          : (stored.verifiedEmail ?? null);
        const changedEmail = data.correo !== draft.data.correo;
        await tx.borradorRegistro.update({
          where: { id: row.id },
          data: {
            datos: { ...data, ...(verifiedEmail ? { verifiedEmail } : {}) },
            correo_verificado: data.correo === verifiedEmail,
            ...(changedEmail
              ? {
                  codigo_hash: null,
                  codigo_expira_en: null,
                  codigo_enviado_en: null,
                  codigo_intentos: 0,
                }
              : {}),
          },
        });
        return { verifiedEmail };
      },
      { timeout: 15000 },
    );
  }

  async draftDocument(tokenHash: string) {
    return this.prisma.$transaction(async (tx) => {
      const { row } = await lockDraft(tx, tokenHash);
      const file = await tx.archivoRegistro.findUnique({ where: { id_borrador: row.id } });
      if (!file) {
        throw new BusinessRuleError('invalid', 'DOCUMENT_MISSING', 'No hay documento cargado');
      }
      return toRegistrationFile(file);
    });
  }

  async findDraft(tokenHash: string) {
    const row = await this.prisma.borradorRegistro.findUnique({ where: { token_hash: tokenHash } });
    return row ? toRegistrationDraft(row) : null;
  }

  async issueCode(
    tokenHash: string,
    hash: string,
    encryptedMail: string,
    expectedEmail?: string,
  ): Promise<string> {
    return this.prisma.$transaction(
      async (tx) => {
        const { row } = await lockDraft(tx, tokenHash);
        if (expectedEmail && (row.datos as unknown as RegistrationData).correo !== expectedEmail) {
          throw new BusinessRuleError(
            'conflict',
            'EMAIL_CHANGED',
            'El correo cambió. Vuelve al resumen y verifica la dirección actual',
          );
        }
        if (row.correo_verificado) {
          return 'verified';
        }
        if (
          row.codigo_enviado_en &&
          Date.now() - row.codigo_enviado_en.getTime() < RESEND_SECONDS * 1000
        ) {
          return 'cooldown';
        }
        const expiresAt = new Date(
          Math.min(Date.now() + CODE_SECONDS * 1000, row.expira_en.getTime()),
        );
        await tx.borradorRegistro.update({
          where: { id: row.id },
          data: {
            codigo_hash: hash,
            codigo_expira_en: expiresAt,
            codigo_enviado_en: new Date(),
            codigo_intentos: 0,
          },
        });
        await tx.correoPendiente.create({
          data: { contenido: encryptedMail, expira_en: expiresAt },
        });
        return 'issued';
      },
      { timeout: 15000 },
    );
  }

  async verifyCode(
    tokenHash: string,
    candidateHash: string,
    expectedEmail?: string,
  ): Promise<string> {
    // Los intentos fallidos se confirman antes de que el caso de uso produzca el error HTTP.
    return this.prisma.$transaction(
      async (tx) => {
        const { row } = await lockDraft(tx, tokenHash);
        if (expectedEmail && (row.datos as unknown as RegistrationData).correo !== expectedEmail) {
          throw new BusinessRuleError(
            'conflict',
            'EMAIL_CHANGED',
            'El correo cambió. Vuelve al resumen y verifica la dirección actual',
          );
        }
        if (row.correo_verificado) {
          return 'verified';
        }
        if (
          !row.codigo_hash ||
          !row.codigo_expira_en ||
          row.codigo_expira_en.getTime() <= Date.now()
        ) {
          return 'expired';
        }
        if (row.codigo_intentos >= 5) {
          return 'locked';
        }
        const correct = timingSafeEqual(Buffer.from(row.codigo_hash), Buffer.from(candidateHash));
        await tx.borradorRegistro.update({
          where: { id: row.id },
          data: {
            codigo_intentos: { increment: 1 },
            ...(correct ? { correo_verificado: true, codigo_hash: null } : {}),
          },
        });
        return correct ? 'verified' : 'incorrect';
      },
      { timeout: 15000 },
    );
  }

  async saveFile(tokenHash: string, file: Omit<RegistrationFile, 'draftId'>): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const { row } = await lockDraft(tx, tokenHash, true);
        const data = {
          id: file.id,
          tipo_documento: file.documentType,
          nombre: file.name,
          mime: file.mime,
          contenido: new Uint8Array(file.bytes),
          size_bytes: file.size,
        };
        await tx.archivoRegistro.upsert({
          where: { id_borrador: row.id },
          create: { ...data, id_borrador: row.id },
          update: data,
        });
      },
      { timeout: 15000 },
    );
  }

  
  async submit(tokenHash: string, input: SubmitRegistrationInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const { row, draft } = await lockDraftForSubmission(
          tx,
          tokenHash,
        );

        if (row.id_solicitud) {
          const previous = await tx.solicitud.findUnique({
            where: { id: row.id_solicitud },
            include: {
              detalle_solicitud: true,
              documento_respaldo: true,
            },
          });

          if (
            !previous ||
            !previous.detalle_solicitud ||
            !previous.documento_respaldo
          ) {
            throw new BusinessRuleError(
              'conflict',
              'SUBMISSION_RESULT_UNAVAILABLE',
              'No se pudo recuperar la solicitud registrada',
            );
          }

          const storedFile = await tx.archivoRegistro.findUnique({
            where: { id_borrador: row.id },
          });

          if (
            !storedFile ||
            previous.documento_respaldo.ruta_storage !==
              storedFile.id
          ) {
            throw new BusinessRuleError(
              'conflict',
              'SUBMISSION_DOCUMENT_MISMATCH',
              'El documento registrado no coincide con el borrador',
            );
          }

          assertSameSubmission(
            input,
            previous.detalle_solicitud,
            storedFile,
          );

          return {
            id: previous.id,
            estado: 'PENDIENTE',
          };
        }

        assertVerifiedDraft(draft);

        const file = await tx.archivoRegistro.findUnique({
          where: { id_borrador: row.id },
        });

        if (
          !file ||
          file.id !== input.rutaStorage ||
          file.tipo_documento !== input.tipoDocumento ||
          file.size_bytes !== input.sizeBytes ||
          (input.mimeType && file.mime !== input.mimeType)
        ) {
          throw new BusinessRuleError(
            'invalid',
            'DOCUMENT_MISMATCH',
            'Adjunta el respaldo cargado en este registro',
          );
        }

        await assertNoDuplicate(tx, draft.data);

        const data = draft.data;

        const detail = await tx.detalleSolicitud.create({
          data: {
            id_carrera: data.carreraId,
            nombre: data.nombres,
            apellido: data.apellidos,
            telefono: data.telefono,
            email: data.correo,
            ci: data.ci,
            extension_ci: data.complementoCi,
            expedido_en:
              data.expedidoEn === 'EX'
                ? 'Extranjero'
                : data.expedidoEn,
            anio_egreso: data.anioEgreso,
            cod_sis: data.codigoSis,
            desea_mentor: input.deseaMentor,
            fecha_titulacion: input.fechaTitulacion
              ? new Date(input.fechaTitulacion)
              : null,
            fecha_ingreso: input.fechaIngreso
              ? new Date(input.fechaIngreso)
              : null,
          },
        });

        const document = await tx.documentoRespaldo.create({
          data: {
            ruta_storage: file.id,
            tamanio_mb: Math.ceil(
              file.size_bytes / 1048576,
            ),
            fecha_creacion: new Date(),
            es_valido: false,
          },
        });

        const application = await tx.solicitud.create({
          data: {
            id_detalle_solicitud: detail.id,
            id_documento_respaldo: document.id,
            estado: 'PENDIENTE',
            fecha_creacion: new Date(),
          },
        });

        await tx.borradorRegistro.update({
          where: { id: row.id },
          data: {
            id_solicitud: application.id,
            codigo_hash: null,
          },
        });
        return { id: application.id, estado: 'PENDIENTE' };
      },
      { timeout: 20000 },
    );
  }

}
