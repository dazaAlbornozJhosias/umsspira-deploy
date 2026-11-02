import { GetSurveyReportController } from './get-survey-report.controller';

describe('GetSurveyReportController', () => {
  it('agrupa las respuestas laborales y conserva el detalle para reportería', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'response-1', condicionLaboral: 'true', cargo: 'Analista', empresa: 'UMSS', area: 'TI',
        modalidad: 'Hibrido', salarioMensual: '5.001–8.000', tiempoInsercion: '6',
        fechaEnvio: new Date('2026-10-27T00:00:00.000Z'),
      },
      {
        id: 'response-2', condicionLaboral: 'false', cargo: null, empresa: null, area: null,
        modalidad: null, salarioMensual: null, tiempoInsercion: null,
        fechaEnvio: new Date('2026-10-26T00:00:00.000Z'),
      },
    ]);
    const controller = new GetSurveyReportController({ respuestaEncuesta: { findMany } } as never);

    await expect(controller.handle()).resolves.toEqual({
      data: {
        total: 2,
        trabajan: 1,
        noTrabajan: 1,
        porModalidad: { Hibrido: 1 },
        porSalario: { '5.001–8.000': 1 },
        porInsercion: { '6': 1 },
        respuestas: [
          expect.objectContaining({ id: 'response-1', condicionLaboral: 'Trabaja', cargo: 'Analista' }),
          expect.objectContaining({ id: 'response-2', condicionLaboral: 'No trabaja', cargo: null }),
        ],
      },
    });
    expect(findMany).toHaveBeenCalledWith({ orderBy: { fechaEnvio: 'desc' } });
  });

  it('devuelve métricas vacías cuando aún no hay respuestas', async () => {
    const controller = new GetSurveyReportController({ respuestaEncuesta: { findMany: jest.fn().mockResolvedValue([]) } } as never);

    await expect(controller.handle()).resolves.toEqual({
      data: {
        total: 0, trabajan: 0, noTrabajan: 0,
        porModalidad: {}, porSalario: {}, porInsercion: {}, respuestas: [],
      },
    });
  });
});
