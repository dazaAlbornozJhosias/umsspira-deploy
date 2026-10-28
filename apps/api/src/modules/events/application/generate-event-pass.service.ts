import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { EventPassRules } from '../domain/event-pass.rules';
import type { EventPassDto } from '@umsspira/shared-types';

@Injectable()
export class GenerateEventPassService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(inscripcionId: string, usuarioTitularId: string): Promise<EventPassDto> {
    // 1. Buscar la inscripción y el evento asociado en la base de datos
    const inscripcion = await this.prisma.inscripcionEvento.findUnique({
      where: { id: inscripcionId },
      include: { evento: true },
    });

    if (!inscripcion || !inscripcion.evento) {
      throw new NotFoundException('No se encontró la inscripción o el evento.');
    }

    // 2. Seguridad: Evitar que un usuario genere el pase de otra persona
    if (inscripcion.id_usuario !== usuarioTitularId) {
      throw new ForbiddenException('No tienes permiso para acceder a este pase.');
    }

    // 3. CA 1: Validar reglas de negocio para ver si es posible generar el pase
    const canGenerate = EventPassRules.canGeneratePass(
      inscripcion.estado ?? '',
      inscripcion.evento.estado ?? ''
    );

    if (!canGenerate) {
      throw new BadRequestException('El estado actual no permite generar un pase QR.');
    }

    // 4. CA 3 y CA 4: Generar token seguro e Idempotencia (Upsert)
    // Si ya existe un pase, lo devuelve sin modificarlo. Si no, lo crea.
    const pase = await this.prisma.paseQr.upsert({
      where: { id_inscripcion: inscripcionId },
      update: {}, 
      create: {
        id_inscripcion: inscripcionId,
        token_hash: EventPassRules.generateOpaqueToken(), // Aquí usamos tu token seguro de 24 bytes
        estado: 'VIGENTE', 
        fecha_expiracion: inscripcion.evento.fecha_fin,
      },
    });

    // 5. CA 6 y CA 7: Calcular el estado efectivo en tiempo real
    const effectiveStatus = EventPassRules.resolveEffectiveStatus(
      pase.estado,
      inscripcion.estado ?? '',
      inscripcion.evento.estado ?? '',
      inscripcion.evento.fecha_fin
    );

    // 6. Mapear al DTO compartido para el Frontend
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
  }
}