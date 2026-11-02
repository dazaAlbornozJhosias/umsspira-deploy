import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { EventPassRules } from '../domain/event-pass.rules';
import type { EventPassDto } from '@umsspira/shared-types';


@Injectable()
export class GenerateEventPassService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(inscripcionId: string, usuarioTitularId: string): Promise<EventPassDto> {
    return this.prisma.$transaction(
      async (tx) => {
        // Serializar generación y cancelación evita crear un pase vigente tras cancelar.
        await tx.$queryRaw`SELECT id FROM inscripcion_evento WHERE id = ${inscripcionId}::uuid FOR UPDATE`;
        const inscripcion = await tx.inscripcionEvento.findUnique({
          where: { id: inscripcionId },
          include: { evento: true },
        });

        if (!inscripcion || !inscripcion.evento) {
          throw new NotFoundException('No se encontró la inscripción o el evento.');
        }

        if (inscripcion.id_usuario !== usuarioTitularId) {
          throw new ForbiddenException('No tienes permiso para acceder a este pase.');
        }

        const canGenerate = EventPassRules.canGeneratePass(
          inscripcion.estado ?? '',
          inscripcion.evento.estado ?? '',
        );

        if (!canGenerate) {
          throw new BadRequestException('El estado actual no permite generar un pase QR.');
        }

        // Si ya existe un pase, lo devuelve sin modificarlo. Si no, lo crea.
        const pase = await tx.paseQr.upsert({
          where: { id_inscripcion: inscripcionId },
          update: {},
          create: {
            id_inscripcion: inscripcionId,
            token_hash: EventPassRules.generateOpaqueToken(),
            estado: 'VIGENTE',
            fecha_expiracion: inscripcion.evento.fecha_fin,
          },
        });

        const effectiveStatus = EventPassRules.resolveEffectiveStatus(
          pase.estado,
          inscripcion.estado ?? '',
          inscripcion.evento.estado ?? '',
          inscripcion.evento.fecha_fin,
        );

        return {
          id: pase.id,
          registrationId: pase.id_inscripcion,
          eventId: inscripcion.evento.id,
          userId: inscripcion.id_usuario,
          qrToken: pase.token_hash,
          status: effectiveStatus.status,
          isValidForAccess: effectiveStatus.isValid,
          issuedAt: pase.fecha_generacion.toISOString(),
          expiresAt: pase.fecha_expiracion ? pase.fecha_expiracion.toISOString() : null,
        };
      },
      { timeout: 15000 },
    );
  }
}
