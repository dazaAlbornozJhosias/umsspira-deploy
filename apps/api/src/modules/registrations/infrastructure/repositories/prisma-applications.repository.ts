import { reserveActivationResend } from './activation-resend';
import { applicationTotalPages } from '../../domain/policies/application-pagination.policy';
import { Injectable } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type {
  ActivationCheck,
  ApplicationsRepository,
  ResolutionMailRecord,
  ActivationResult,
} from '../../application/ports/applications-repository.port';

import type {
  ApplicationQuery,
  ReviewInput,
} from '../../application/contracts/registration-inputs';
import { toApplication } from '../translators/application.translator';
import { applicationInclude, toRegistrationFile } from '../translators/registration.translator';
import type { ApplicationMetrics } from '../../domain/entities/application';
import {
  BOLIVIA_TIME_ZONE,
  resolveApplicationPeriod,
  todayRange,
  urgentCutoff,
} from '../../domain/policies/application-period.policy';

export function scopedApplication(actor: ActorContext, id?: string): Prisma.SolicitudWhereInput {
  return {
    ...(id ? { id } : {}),
    detalle_solicitud: { is: { id_carrera: { in: actor.scopes.careerIds } } },
  };
}

@Injectable()
export class PrismaApplicationsRepository implements ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async renewActivation(
    actor: ActorContext,
    id: string,
    hash: string,
    encryptedMail: string,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await tx.solicitud.findFirst({ where: scopedApplication(actor, id) });
        if (!row) {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está a tu cargo',
          );
        }
        if (!['APROBADA', 'APPROVED'].includes(row.estado ?? '') || row.activada_en) {
          throw new BusinessRuleError(
            'conflict',
            'ACTIVATION_NOT_ALLOWED',
            'Solo se reenvía la activación de una solicitud aprobada sin cuenta activa',
          );
        }
        await reserveActivationResend(tx, id);
        await tx.solicitud.update({
          where: { id },
          data: {
            activacion_hash: hash,
            activacion_expira_en: new Date(Date.now() + 86400000),
            activacion_intentos: 0,
          },
        });
        await tx.correoPendiente.create({
          data: { contenido: encryptedMail, expira_en: new Date(Date.now() + 86400000) },
        });
      },
      { timeout: 15000 },
    );
  }

  async list(actor: ActorContext, query: ApplicationQuery) {
    const detailFilters: Prisma.DetalleSolicitudWhereInput[] = [];
    if (query.career) {
      detailFilters.push({
        carrera: { is: { nombre: { contains: query.career, mode: 'insensitive' } } },
      });
    }
    if (query.search) {
      const search = query.search;
      detailFilters.push({
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { ci: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          ...(/^\d{6,9}$/.test(search) ? [{ cod_sis: search }] : []),
        ],
      });
    }
    const overdue: Prisma.SolicitudWhereInput = {
      estado: 'PENDIENTE',
      fecha_creacion: { lt: new Date(Date.now() - 48 * 3600000) },
    };
    const period = query.period
      ? resolveApplicationPeriod(
          { period: query.period, year: query.year, from: query.from, to: query.to },
          new Date(),
        )
      : undefined;

        const where: Prisma.SolicitudWhereInput = {
      AND: [
        scopedApplication(actor),
        ...(query.status ? [{ estado: query.status }] : []),
        ...(detailFilters.length ? [{ detalle_solicitud: { is: { AND: detailFilters } } }] : []),
        ...(query.age === 'over48'
          ? [overdue]
          : query.age === 'within48'
            ? [{ NOT: overdue }]
            : []),
        ...(period ? [{ fecha_creacion: period }] : []),
      ],
    };
    // Primero pendientes antiguos; luego expedientes dictaminados recientes.
    const [total, pending] = await this.prisma.$transaction([
      this.prisma.solicitud.count({ where }),
      this.prisma.solicitud.count({ where: { AND: [where, { estado: 'PENDIENTE' }] } }),
    ]);
    const offset = (query.page - 1) * query.pageSize;
    const pendingRows =
      offset < pending
        ? await this.prisma.solicitud.findMany({
            where: { AND: [where, { estado: 'PENDIENTE' }] },
            include: applicationInclude,
            orderBy: [{ fecha_creacion: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: query.pageSize,
          })
        : [];
    const remaining = query.pageSize - pendingRows.length;
    const otherRows =
      remaining > 0
        ? await this.prisma.solicitud.findMany({
            where: { AND: [where, { estado: { not: 'PENDIENTE' } }] },
            include: applicationInclude,
            orderBy: [{ fecha_creacion: 'desc' }, { id: 'asc' }],
            skip: Math.max(0, offset - pending),
            take: remaining,
          })
        : [];
    return {
      items: [...pendingRows, ...otherRows].map(toApplication),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: applicationTotalPages(total, query.pageSize),
    };
  }

   async metrics(actor: ActorContext, now: Date): Promise<ApplicationMetrics> {
    const scope = scopedApplication(actor);
    const today = todayRange(now);
    const [receivedToday, pending, urgent, resolved] = await this.prisma.$transaction([
      this.prisma.solicitud.count({ where: { AND: [scope, { fecha_creacion: today }] } }),
      this.prisma.solicitud.count({ where: { AND: [scope, { estado: 'PENDIENTE' }] } }),
      this.prisma.solicitud.count({
        where: { AND: [scope, { estado: 'PENDIENTE', fecha_creacion: { lt: urgentCutoff(now) } }] },
      }),
      // Una solicitud con varios dictámenes el mismo día se cuenta una sola vez.
      this.prisma.dictamen.findMany({
        where: { fecha_creacion: today, solicitud: { is: scope } },
        distinct: ['id_solicitud'],
        select: { id_solicitud: true },
      }),
    ]);
    return {
      receivedToday,
      pending,
      urgent,
      resolvedToday: resolved.length,
      generatedAt: now.toISOString(),
      timeZone: BOLIVIA_TIME_ZONE,
    };
  }

  async find(actor: ActorContext, id: string) {
    const row = await this.prisma.solicitud.findFirst({
      where: scopedApplication(actor, id),
      include: applicationInclude,
    });
    if (!row) {
      throw new BusinessRuleError(
        'missing',
        'APPLICATION_NOT_FOUND',
        'La solicitud no existe o no está a tu cargo',
      );
    }
    return toApplication(row);
  }

  async document(actor: ActorContext, id: string) {
    const row = await this.prisma.archivoRegistro.findFirst({
      where: { borrador: { solicitud: { is: scopedApplication(actor, id) } } },
    });
    if (!row) {
      throw new BusinessRuleError('missing', 'DOCUMENT_NOT_FOUND', 'No se encontró el respaldo');
    }
    return toRegistrationFile(row);
  }

  async review(
    actor: ActorContext,
    id: string,
    input: ReviewInput,
    activationHash: string | null,
    encryptedMail: string,
    mail: ResolutionMailRecord,

  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await tx.solicitud.findFirst({
          where: scopedApplication(actor, id),
          select: { estado: true, id_documento_respaldo: true },
        });
        if (!row) {
          throw new BusinessRuleError(
            'missing',
            'APPLICATION_NOT_FOUND',
            'La solicitud no existe o no está a tu cargo',
          );
        }
        const isPending =
          row.estado === 'PENDIENTE' ||
          row.estado === 'PENDING' ||
          row.estado?.toUpperCase() === 'PENDIENTE' ||
          row.estado?.toUpperCase() === 'PENDING';

        if (!isPending) {
          throw new BusinessRuleError(
            'conflict',
            'APPLICATION_ALREADY_REVIEWED',
             'La solicitud ya fue dictaminada',
  )       ;
        }
        const approved = input.decision === 'APROBADA';
        const now = new Date();
        const category = approved ? null : input.category!;
        const note = approved ? null : input.note!;
        const review = await tx.dictamen.create({
          data: {
            id_solicitud: id,
            revisor_id: actor.id,
            decision: input.decision,
            categoria: category,
            justificacion: note,
            fecha_creacion: now,
            subsanada: false,
          },
        });
        await tx.solicitud.update({
          where: { id },
          data: {
            estado: input.decision,
            activacion_hash: activationHash,
            activacion_expira_en: approved ? new Date(Date.now() + 86400000) : null,
          },
        });
        if (row.id_documento_respaldo) {
          await tx.documentoRespaldo.update({
            where: { id: row.id_documento_respaldo },
            data: { es_valido: approved },
          });
        }
        await tx.correoPendiente.create({
          data: { contenido: encryptedMail, expira_en: new Date(Date.now() + 86400000) },
        });
        await tx.correoTramite.create({
          select: { id: true },
          data: {
            id_solicitud: id,
            id_dictamen: review.id,
            tipo: mail.type,
            email_destino: mail.to,
            asunto: mail.subject,
            estado: 'pendiente',
          },
        });
        return {
          id: review.id,
          applicationId: id,
          decision: input.decision,
          status: input.decision,
          category,
          note,
          reviewedBy: actor.id,
          reviewedAt: now.toISOString(),
          notificationStatus: 'EN_COLA' as const,
        };
      },
      { timeout: 15000 },
    );
  }

    async verifyActivation(id: string, codeHash: string): Promise<ActivationCheck> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await tx.solicitud.findUnique({ where: { id } });
        if (!row || !['APROBADA', 'APPROVED'].includes(row.estado ?? '') || row.activada_en || !row.activacion_hash) {
          return { result: 'invalid' };
        }
        if (!row.activacion_expira_en || row.activacion_expira_en.getTime() <= Date.now()) {
          return { result: 'expired' };
        }
        if (row.activacion_intentos >= 5) {
          return { result: 'locked' };
        }
        if (!timingSafeEqual(Buffer.from(row.activacion_hash), Buffer.from(codeHash))) {
          // El contador se confirma al devolver el resultado, sin lanzar error ni revertir.
          await tx.solicitud.update({
            where: { id },
            data: { activacion_intentos: { increment: 1 } },
          });
          return { result: row.activacion_intentos + 1 >= 5 ? 'locked' : 'invalid' };
        }
        return { result: 'verified', binding: row.activacion_hash };
      },
      { timeout: 15000 },
    );
  }

  async activate(
  id: string,
  passwordHash: string,
  matchesBinding: (binding: string) => boolean,
  ): Promise<ActivationResult> {
    return this.prisma.$transaction(
      async (tx): Promise<ActivationResult> => {
        await tx.$queryRaw`SELECT id FROM solicitud WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await tx.solicitud.findUnique({
          where: { id },
          include: { detalle_solicitud: true },
        });
                if (!row || !['APROBADA', 'APPROVED'].includes(row.estado ?? '')) {
          return 'invalid';
        }
        if (row.activada_en) {
          return 'already';
        }
        if (!row.activacion_hash || !matchesBinding(row.activacion_hash)) {
     
        return 'invalid';
        }
        if (!row.activacion_expira_en || row.activacion_expira_en.getTime() <= Date.now()) {
          return 'expired';
        }
        if (row.activacion_intentos >= 5) {
          return 'locked';
        }
        const detail = row.detalle_solicitud;
        if (!detail?.email) {
          return 'invalid';
        }
        const role = await tx.rolAcceso.findUnique({ where: { codigo: 'titulado' } });
        if (!role?.habilitado) {
          throw new BusinessRuleError(
            'conflict',
            'ROLE_UNAVAILABLE',
            'El rol titulado no está habilitado; revisa el catálogo de permisos',
          );
        }
        const name = [detail.nombre, detail.apellido].filter(Boolean).join(' ');
        const existing = await tx.usuario.findUnique({
          where: { correo: detail.email },
          include: { cuenta_acceso: true },
        });
        // Todos los conflictos se resuelven antes de escribir: devolver un resultado
        // confirmaría la transacción y dejaría filas a medias.
        if (
          existing &&
          (existing.estado !== 'PENDIENTE' ||
            existing.cuenta_acceso ||
            (existing.rol && existing.rol !== 'titulado'))
        ) {
          return 'account-exists';
        }
        const found =
          (row.id_titulado
            ? await tx.titulado.findUnique({ where: { id: row.id_titulado } })
            : null) ??
          (existing
            ? await tx.titulado.findUnique({ where: { id_usuario: existing.usuario_id } })
            : null);
        if (found?.id_usuario && found.id_usuario !== existing?.usuario_id) {
          return 'account-exists';
        }
        let userId: string;
        if (existing) {
          await tx.usuario.update({
            where: { usuario_id: existing.usuario_id },
            data: {
              nombre: name,
              rol: 'titulado',
              estado: 'ACTIVO',
              cuenta_acceso: { create: { password_hash: passwordHash } },
            },
          });
          userId = existing.usuario_id;
        } else {
          const user = await tx.usuario.create({
            data: {
              nombre: name,
              correo: detail.email,
              rol: 'titulado',
              estado: 'ACTIVO',
              usuario_id: randomUUID(),
              cuenta_acceso: { create: { password_hash: passwordHash } },
            },
          });
          userId = user.usuario_id;
        }
        const titulado = found
          ? await tx.titulado.update({ where: { id: found.id }, data: { id_usuario: userId } })
          : await tx.titulado.create({
              data: {
                id_usuario: userId,
                id_carrera: detail.id_carrera,
                nombre: detail.nombre,
                apellido: detail.apellido,
                ci: detail.ci,
                extension_ci: detail.extension_ci,
                cod_sis: detail.cod_sis,
                anio_ingreso: detail.fecha_ingreso?.getUTCFullYear(),
              },
            });
        await tx.usuarioSolicitud.createMany({
          data: [{ id_usuario: userId, id_solicitud: id, detalle_solicitud_id: detail.id }],
          skipDuplicates: true,
        });
        await tx.solicitud.update({
          where: { id },
          data: { activada_en: new Date(), activacion_hash: null, id_titulado: titulado.id },
        });
        return 'activated';
      },
      { timeout: 20000 },
    );
  }
}
