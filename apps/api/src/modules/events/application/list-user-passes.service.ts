import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { EventPassRules } from '../domain/event-pass.rules';
import type { EventPassDto } from '@umsspira/shared-types';

@Injectable()
export class ListUserPassesService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(usuarioTitularId: string): Promise<EventPassDto[]> {
    // Busca todos los pases del usuario incluyendo los datos de su evento
    const pases = await this.prisma.paseQr.findMany({
      where: {
        inscripcion: {
          id_usuario: usuarioTitularId,
        },
      },
      include: {
        inscripcion: {
          include: {
            evento: true,
          },
        },
      },
      orderBy: { fecha_generacion: 'desc' },
    });

    // CA 5, 6 y 7: Mapear y evaluar la vigencia en tiempo real
    return pases.map((pase) => {
      const effectiveStatus = EventPassRules.resolveEffectiveStatus(
        pase.estado,
        pase.inscripcion?.estado ?? '',
        pase.inscripcion?.evento?.estado ?? '',
        pase.inscripcion?.evento?.fecha_fin ?? new Date(0),
      );

      return {
        id: pase.id,
        registrationId: pase.id_inscripcion,
        eventId: pase.inscripcion?.id_evento ?? '',
        userId: usuarioTitularId,
        qrToken: pase.token_hash, // El frontend usará este token para dibujar la imagen QR
        status: effectiveStatus.status,
        isValidForAccess: effectiveStatus.isValid,
        issuedAt: pase.fecha_generacion.toISOString(),
        expiresAt: pase.fecha_expiracion ? pase.fecha_expiracion.toISOString() : null,
      };
    });
  }
}