import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';

@Controller('reports')
export class GetSurveyReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('surveys')
  @RequirePermissions('reportes:read')
  async handle() {
    const responses = await this.prisma.respuestaEncuesta.findMany({ orderBy: { fechaEnvio: 'desc' } });
    const working = responses.filter((item) => item.condicionLaboral === 'true');
    const countBy = (values: Array<string | null>) => values.reduce<Record<string, number>>((result, value) => {
      const key = value?.trim() || 'Sin dato';
      result[key] = (result[key] ?? 0) + 1;
      return result;
    }, {});

    return {
      data: {
        total: responses.length,
        trabajan: working.length,
        noTrabajan: responses.length - working.length,
        porModalidad: countBy(working.map((item) => item.modalidad)),
        porSalario: countBy(working.map((item) => item.salarioMensual)),
        porInsercion: countBy(working.map((item) => item.tiempoInsercion)),
        respuestas: responses.map((item) => ({
          id: item.id,
          condicionLaboral: item.condicionLaboral === 'true' ? 'Trabaja' : 'No trabaja',
          cargo: item.cargo,
          empresa: item.empresa,
          area: item.area,
          modalidad: item.modalidad,
          salarioMensual: item.salarioMensual,
          tiempoInsercion: item.tiempoInsercion,
          fechaEnvio: item.fechaEnvio.toISOString(),
        })),
      },
    };
  }
}
