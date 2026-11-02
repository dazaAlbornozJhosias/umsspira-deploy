import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { SubmitSurveyInput } from '../../application/contracts/submit-survey.input';
import type { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';

@Injectable()
export class PrismaSurveyRepository implements SurveyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: SubmitSurveyInput) {
    return this.prisma.respuestaEncuesta.create({
        data: {
          idEncuesta: data.idEncuesta,
          idTitulado: data.idTitulado,
          condicionLaboral: String(data.condicionLaboral),
          cargo: data.cargo,
          empresa: data.empresa,
          area: data.area,
          modalidad: data.modalidad,
          salarioMensual: data.salarioMensual,
          tiempoInsercion: data.tiempoInsercion,
        },
      });
  }
}
