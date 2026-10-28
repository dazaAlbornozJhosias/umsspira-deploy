
import type { EventPassStatus } from '@umsspira/shared-types'; // Ajusta la ruta de importación si es necesario
import { randomBytes } from 'crypto';


export class EventPassRules {
  /**
   * CA 3: Genera el token opaco único que irá dentro de la imagen QR.
   */
  static generateOpaqueToken(): string {
    return randomBytes(24).toString('hex');
  }

  static buildQrContent(opaqueToken: string): string {
    return `UMSSPIRA:PASS:v1:${opaqueToken}`;
  }

  /**
   * CA 1: Verifica si el estado de la inscripción permite generar un pase.
   */
  static canGeneratePass(
    estadoInscripcion: string,
    estadoEvento: string,
  ): boolean {
    return estadoInscripcion === 'CONFIRMADA' && estadoEvento === 'PUBLICADO';
  }

  /**
   * CA 6 y CA 7: Evalúa el estado en tiempo real del pase.
   */
  static resolveEffectiveStatus(
    estadoGuardado: string, // <-- Ahora Prisma enviará el VarChar(20) como string normal
    estadoInscripcion: string,
    estadoEvento: string,
    fechaFinEvento: Date | null,
    now: Date = new Date(),
  ): { status: EventPassStatus; isValid: boolean } { // <-- Devolvemos el tipo estricto
    
    // CA 6: Inscripción cancelada o evento cancelado invalidan el pase
    if (
      estadoGuardado === 'INVALIDADO' ||
      estadoInscripcion === 'CANCELADA' ||
      estadoEvento === 'CANCELADO'
    ) {
      return { status: 'INVALIDADO', isValid: false };
    }

    // CA 7: Si el evento ya terminó en tiempo real, el pase está vencido
    if (
      estadoGuardado === 'VENCIDO' ||
      (fechaFinEvento && fechaFinEvento.getTime() <= now.getTime())
    ) {
      return { status: 'VENCIDO', isValid: false };
    }

    return { status: 'ACTIVO', isValid: true };
  }
}