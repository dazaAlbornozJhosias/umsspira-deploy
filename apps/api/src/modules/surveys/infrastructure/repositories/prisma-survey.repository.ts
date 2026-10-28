import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';

@Injectable()
export class PrismaSurveyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardarRespuesta(data: {
    idEncuesta: string;
    idTitulado: string;
    condicionLaboral: string;
    cargo?: string;
    empresa?: string;
    area?: string;
    modalidad?: string;
    salarioMensual?: string;
    tiempoInsercion?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      return await tx.respuestaEncuesta.create({
        data: {
          idEncuesta: data.idEncuesta,
          idTitulado: data.idTitulado,
          condicionLaboral: data.condicionLaboral,
          cargo: data.cargo,
          empresa: data.empresa,
          area: data.area,
          modalidad: data.modalidad,
          salarioMensual: data.salarioMensual,
          tiempoInsercion: data.tiempoInsercion,
        },
      });
    });
  }
}