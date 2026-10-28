import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { StoredFile } from '../../../../shared/files/contracts/uploaded-file';
import type { ProfileRepository } from '../../application/ports/profile-repository.port';
import type {
  CertificationInput,
  EducationInput,
  ExperienceInput,
  ProfileChange,
  ProfileScope,
} from '../../application/contracts/profile-inputs';
import type { ProfileSection, ProfileSnapshot } from '../../domain/entities/profile-record';
import { assertUniqueEducation } from '../../domain/policies/education.policy';
import {
  toBackup,
  toCertification,
  toDescription,
  toEducation,
  toExperience,
} from '../translators/profile.translator';
import { lockGraduate, profileRecordMissing, rejectProfileRecord } from './profile-transaction';

const certificationInclude = {
  certificacion_respaldo_registros: {
    orderBy: [{ fecha_subida: 'desc' as const }, { id: 'asc' as const }],
    take: 1,
  },
};

// La descripción es una sola fila de perfil_area por titulado; si hubiera más, manda la más antigua
const descriptionOrder = [{ fecha_creacion: 'asc' as const }, { id: 'asc' as const }];

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async summary(scope: ProfileScope): Promise<ProfileSnapshot> {
    const row = await this.prisma.titulado.findFirst({
      where: { id: scope.graduateId, id_usuario: scope.userId },
      include: {
        carrera: true,
        formacion_academica_registros: {
          orderBy: [{ anio_egreso: 'desc' }, { fecha_creacion: 'desc' }, { id: 'asc' }],
        },
        experiencia_laboral_registros: {
          orderBy: [{ fecha_inicio: 'desc' }, { fecha_creacion: 'desc' }, { id: 'asc' }],
        },
        certificacion_registros: {
          orderBy: [
            { anio_emision: { sort: 'desc', nulls: 'last' } },
            { fecha_creacion: 'desc' },
            { id: 'asc' },
          ],
          include: certificationInclude,
        },
        perfil_area_registros: { orderBy: descriptionOrder, take: 1 },
      },
    });
    if (!row) {
      throw new BusinessRuleError(
        'missing',
        'PROFILE_NOT_FOUND',
        'No se encontró tu perfil de titulado',
      );
    }
    return {
      graduate: {
        id: row.id,
        name: [row.nombre, row.apellido].filter(Boolean).join(' ') || null,
        career: row.carrera?.nombre ?? null,
        cohort: null,
      },
      education: row.formacion_academica_registros.map(toEducation),
      experience: row.experiencia_laboral_registros.map(toExperience),
      certifications: row.certificacion_registros.map(toCertification),
      description: toDescription(row.perfil_area_registros[0]),
    };
  }

  async createEducation(scope: ProfileScope, input: EducationInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        await this.checkEducation(tx, scope, input);
        return toEducation(
          await tx.formacionAcademica.create({
            data: {
              id_titulado: scope.graduateId,
              institucion: input.institucion,
              titulo: input.titulo,
              grado: input.grado,
              anio_egreso: input.anioEgreso,
            },
          }),
        );
      },
      { timeout: 15000 },
    );
  }

  async createExperience(scope: ProfileScope, input: ExperienceInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        return toExperience(
          await tx.experienciaLaboral.create({
            data: {
              id_titulado: scope.graduateId,
              empresa: input.empresa,
              cargo: input.cargo,
              fecha_inicio: new Date(input.fechaInicio),
              fecha_fin: input.fechaFin ? new Date(input.fechaFin) : null,
            },
          }),
        );
      },
      { timeout: 15000 },
    );
  }

  async createCertification(scope: ProfileScope, input: CertificationInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        return toCertification(
          await tx.certificacion.create({
            data: {
              id_titulado: scope.graduateId,
              nombre: input.nombre,
              entidad_emisora: input.entidadEmisora,
              grado: input.grado,
              anio_emision: input.anioEmision,
            },
          }),
        );
      },
      { timeout: 15000 },
    );
  }

  async find(scope: ProfileScope, section: ProfileSection, id: string) {
    const where = { id, id_titulado: scope.graduateId, titulado: { id_usuario: scope.userId } };
    switch (section) {
      case 'formacion-academica': {
        const row = await this.prisma.formacionAcademica.findFirst({ where });
        return row ? toEducation(row) : profileRecordMissing();
      }
      case 'experiencia-laboral': {
        const row = await this.prisma.experienciaLaboral.findFirst({ where });
        return row ? toExperience(row) : profileRecordMissing();
      }
      case 'certificaciones': {
        const row = await this.prisma.certificacion.findFirst({
          where,
          include: certificationInclude,
        });
        return row ? toCertification(row) : profileRecordMissing();
      }
    }
  }

  async update(scope: ProfileScope, id: string, change: ProfileChange) {
    return this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        const where = { id, id_titulado: scope.graduateId };
        switch (change.section) {
          case 'formacion-academica': {
            if (!(await tx.formacionAcademica.findFirst({ where, select: { id: true } }))) {
              await rejectProfileRecord(tx.formacionAcademica.findUnique({ where: { id } }));
            }
            await this.checkEducation(tx, scope, change.data, id);
            return toEducation(
              await tx.formacionAcademica.update({
                where,
                data: {
                  institucion: change.data.institucion,
                  titulo: change.data.titulo,
                  grado: change.data.grado,
                  anio_egreso: change.data.anioEgreso,
                },
              }),
            );
          }
          case 'experiencia-laboral': {
            if (!(await tx.experienciaLaboral.findFirst({ where, select: { id: true } }))) {
              await rejectProfileRecord(tx.experienciaLaboral.findUnique({ where: { id } }));
            }
            return toExperience(
              await tx.experienciaLaboral.update({
                where,
                data: {
                  empresa: change.data.empresa,
                  cargo: change.data.cargo,
                  fecha_inicio: new Date(change.data.fechaInicio),
                  fecha_fin: change.data.fechaFin ? new Date(change.data.fechaFin) : null,
                },
              }),
            );
          }
          case 'certificaciones': {
            if (!(await tx.certificacion.findFirst({ where, select: { id: true } }))) {
              await rejectProfileRecord(tx.certificacion.findUnique({ where: { id } }));
            }
            return toCertification(
              await tx.certificacion.update({
                where,
                data: {
                  nombre: change.data.nombre,
                  entidad_emisora: change.data.entidadEmisora,
                  grado: change.data.grado,
                  anio_emision: change.data.anioEmision,
                },
                include: certificationInclude,
              }),
            );
          }
        }
      },
      { timeout: 15000 },
    );
  }

  async remove(scope: ProfileScope, section: ProfileSection, id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        const where = { id, id_titulado: scope.graduateId };
        let count = 0;
        switch (section) {
          case 'formacion-academica':
            count = (await tx.formacionAcademica.deleteMany({ where })).count;
            break;
          case 'experiencia-laboral':
            count = (await tx.experienciaLaboral.deleteMany({ where })).count;
            break;
          case 'certificaciones':
            if (!(await tx.certificacion.findFirst({ where, select: { id: true } }))) {
              await rejectProfileRecord(tx.certificacion.findUnique({ where: { id } }));
            }
            await tx.certificacionRespaldo.deleteMany({ where: { id_certificacion: id } });
            count = (await tx.certificacion.deleteMany({ where })).count;
            break;
        }
        if (!count) {
          await rejectProfileRecord(
            section === 'formacion-academica'
              ? tx.formacionAcademica.findUnique({ where: { id } })
              : tx.experienciaLaboral.findUnique({ where: { id } }),
          );
        }
      },
      { timeout: 15000 },
    );
  }

  async saveBackup(scope: ProfileScope, certificationId: string, file: StoredFile) {
    return this.prisma.$transaction(
      async (tx) => {
        await lockGraduate(tx, scope);
        const certificate = await tx.certificacion.findFirst({
          where: { id: certificationId, id_titulado: scope.graduateId },
          select: { id: true },
        });
        if (!certificate) {
          await rejectProfileRecord(
            tx.certificacion.findUnique({ where: { id: certificationId } }),
          );
        }
        await tx.certificacionRespaldo.deleteMany({ where: { id_certificacion: certificationId } });
        const row = await tx.certificacionRespaldo.create({
          data: {
            id: file.id,
            id_certificacion: certificationId,
            tipo: 'FOTO',
            archivo_key: file.id,
            archivo: {
              create: {
                nombre: file.name,
                mime: file.mime,
                contenido: new Uint8Array(file.bytes),
                size_bytes: file.size,
              },
            },
          },
        });
        return toBackup(row);
      },
      { timeout: 15000 },
    );
  }

  async readBackup(scope: ProfileScope, certificationId: string): Promise<StoredFile> {
    return this.loadBackup({
      id_certificacion: certificationId,
      certificacion: {
        id_titulado: scope.graduateId,
        titulado: { id_usuario: scope.userId },
      },
    });
  }

  async findBackupOwner(certificationId: string) {
    const row = await this.prisma.certificacion.findUnique({
      where: { id: certificationId },
      select: {
        id_titulado: true,
        titulado: { select: { id_usuario: true } },
        _count: { select: { certificacion_respaldo_registros: true } },
      },
    });
    if (!row) {
      return null;
    }
    return {
      graduateId: row.id_titulado,
      userId: row.titulado.id_usuario,
      hasBackup: row._count.certificacion_respaldo_registros > 0,
    };
  }

  async readBackupFile(certificationId: string): Promise<StoredFile> {
    return this.loadBackup({ id_certificacion: certificationId });
  }

  async findDescription(scope: ProfileScope) {
    const row = await this.prisma.perfilArea.findFirst({
      where: { id_titulado: scope.graduateId, titulado: { id_usuario: scope.userId } },
      orderBy: descriptionOrder,
    });
    return toDescription(row);
  }

  async saveDescription(scope: ProfileScope, text: string) {
    return this.prisma.$transaction(
      async (tx) => {
        // El bloqueo del titulado evita que dos guardados simultáneos creen dos filas
        await lockGraduate(tx, scope);
        const now = new Date();
        const current = await tx.perfilArea.findFirst({
          where: { id_titulado: scope.graduateId },
          orderBy: descriptionOrder,
          select: { id: true },
        });
        // Solo se toca la descripción: el área y el radar quedan a cargo de la Épica 3
        const row = current
          ? await tx.perfilArea.update({
              where: { id: current.id },
              data: { descripcion_profesional: text, fecha_actualizacion: now },
            })
          : await tx.perfilArea.create({
              data: {
                id_titulado: scope.graduateId,
                area_id: null,
                descripcion_profesional: text,
                fecha_creacion: now,
                fecha_actualizacion: now,
              },
            });
        return toDescription(row);
      },
      { timeout: 15000 },
    );
  }

  private async loadBackup(where: Prisma.CertificacionRespaldoWhereInput): Promise<StoredFile> {
    const row = await this.prisma.archivoPerfil.findFirst({
      where: { respaldo: where },
      orderBy: { respaldo: { fecha_subida: 'desc' } },
    });
    if (!row) {
      throw new BusinessRuleError(
        'missing',
        'BACKUP_NOT_FOUND',
        'No se encontró un respaldo de tu certificación',
      );
    }
    return {
      id: row.id_respaldo,
      name: row.nombre,
      mime: row.mime,
      bytes: row.contenido,
      size: row.size_bytes,
    };
  }

  private async checkEducation(
    tx: Prisma.TransactionClient,
    scope: ProfileScope,
    input: EducationInput,
    excludedId?: string,
  ) {
    const rows = await tx.formacionAcademica.findMany({ where: { id_titulado: scope.graduateId } });
    assertUniqueEducation(input, rows.map(toEducation), excludedId);
  }
}
