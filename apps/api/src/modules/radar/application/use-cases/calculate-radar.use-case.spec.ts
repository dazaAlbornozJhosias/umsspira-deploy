import { CalculateRadarUseCase } from './calculate-radar.use-case';
import type { RadarRepositoryPort } from '../ports/radar-repository.port';

describe('CalculateRadarUseCase', () => {
  it('calcula los ejes, persiste el resultado y devuelve el cálculo guardado', async () => {
    // 1. Mockeamos el repositorio de forma segura con jest
    const saveCalculation = jest.fn().mockResolvedValue({});
    const repository = { saveCalculation } as unknown as RadarRepositoryPort;
    
    // 2. Instanciamos el caso de uso antiguo
    const useCase = new CalculateRadarUseCase(repository);
    const calculatedAt = new Date('2026-10-22T12:00:00.000Z');

    // 3. Ejecutamos
    const result = await useCase.execute({
      graduateId: 'graduate-id',
      inputHash: 'input-hash',
      keywords: [{ term: 'typescript', count: 2 }],
      areaWeights: [{ term: 'typescript', area: 'software-development', weight: 5 }],
      unmapped: [{ term: 'desconocido', count: 1 }],
      calculatedAt,
    });

    // 4. Verificamos aserciones
    expect(result.areas.find(({ area }) => area === 'software-development')).toMatchObject({
      score: 10,
      percentage: 66.67,
      weighting: 5,
    });
    expect(result.unmapped).toEqual([{ term: 'desconocido', count: 1 }]);
    
    // Aseguramos que se haya llamado al método actualizado
    expect(saveCalculation).toHaveBeenCalled();
  });
});