import { InMemoryRadarRepository } from '../../../../../test/adapters/in-memory-radar.repository';
import { StubKeywordExtractor } from '../../../../../test/adapters/in-memory-radar-ports';
import { RADAR_AREA_IDS } from '../../domain/entities/radar-area';
import { KeywordDictionaryUnavailableError } from '../../domain/errors/keyword-dictionary-unavailable-error';
import type { RadarAreaVector } from '../contracts/radar-vector';
import { RecalculateRadarUseCase } from './recalculate-radar.use-case';

const SOFTWARE = RADAR_AREA_IDS['software-development'];
const GRADUATE = '10000000-0000-4000-8000-000000000002';

function findArea(areas: RadarAreaVector[], areaId: string): RadarAreaVector {
  const found = areas.find((area) => area.areaId === areaId);

  if (!found) {
    throw new Error(`No se encontro el area ${areaId}`);
  }

  return found;
}

describe('RecalculateRadarUseCase - keywords influyentes y afinidad previa', () => {
  let repository: InMemoryRadarRepository;
  let extractor: StubKeywordExtractor;
  let useCase: RecalculateRadarUseCase;

  beforeEach(() => {
    repository = new InMemoryRadarRepository();
    repository.areaWeights = {
      [SOFTWARE]: [
        { term: 'javascript', peso: 5 },
        { term: 'typescript', peso: 5 },
      ],
    };
    extractor = new StubKeywordExtractor();
    useCase = new RecalculateRadarUseCase(extractor, repository);
  });

  it('en el primer calculo previousAffinity es null y persiste el top de cada area', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    extractor.unmapped = [{ term: 'xylophone', count: 1 }];

    const result = await useCase.execute(GRADUATE, ['javascript'], true);

    expect(result.recalculated).toBe(true);
    expect(result.hasLaborHistory).toBe(true);
    expect(result.areas).toHaveLength(6);
    expect(result.areas.every((area) => area.previousAffinity === null)).toBe(true);
    expect(findArea(result.areas, SOFTWARE)).toMatchObject({
      affinity: 12.5,
      previousAffinity: null,
      weighting: 5,
      topKeywords: [
        { keyword: 'javascript', weight: 5, frequency: 1, points: 5, percentage: 12.5 },
      ],
    });
    expect(result.unmappedKeywords).toEqual(['xylophone']);

    expect(repository.saveCalls).toBe(1);
    const saved = repository.savedCalculations[0];
    expect(saved.afinidad).toHaveLength(6);
    expect(saved.afinidad.find((area) => area.areaId === SOFTWARE)?.palabrasClaveTop).toEqual([
      { keyword: 'javascript', weight: 5, frequency: 1, points: 5, percentage: 12.5 },
    ]);
  });

  it('en el segundo calculo previousAffinity toma el porcentaje del calculo anterior', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    await useCase.execute(GRADUATE, ['javascript'], true);

    extractor.keywords = [{ term: 'javascript', count: 2 }];
    const second = await useCase.execute(GRADUATE, ['javascript javascript'], true);

    expect(findArea(second.areas, SOFTWARE)).toMatchObject({
      affinity: 25,
      previousAffinity: 12.5,
      topKeywords: [{ keyword: 'javascript', frequency: 2, points: 10, percentage: 25 }],
    });
    expect(repository.saveCalls).toBe(2);
  });

  it('en el tercer calculo la referencia es el segundo, no el primero', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    await useCase.execute(GRADUATE, ['javascript'], true);

    extractor.keywords = [{ term: 'javascript', count: 2 }];
    await useCase.execute(GRADUATE, ['javascript javascript'], true);

    extractor.keywords = [{ term: 'javascript', count: 3 }];
    const third = await useCase.execute(
      GRADUATE,
      ['javascript javascript javascript'],
      true,
    );

    expect(findArea(third.areas, SOFTWARE)).toMatchObject({
      affinity: 37.5,
      previousAffinity: 25,
    });
  });

  it('recalcular sin cambios no crea fila y conserva la referencia anterior (CA-HU8-11)', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    await useCase.execute(GRADUATE, ['javascript'], true);

    extractor.keywords = [{ term: 'javascript', count: 2 }];
    await useCase.execute(GRADUATE, ['javascript javascript'], true);

    const unchanged = await useCase.execute(GRADUATE, ['javascript javascript'], true);

    expect(unchanged.recalculated).toBe(false);
    expect(repository.saveCalls).toBe(2);
    expect(findArea(unchanged.areas, SOFTWARE)).toMatchObject({
      affinity: 25,
      previousAffinity: 12.5,
    });
  });

  it('persiste un calculo VACIO con las seis areas en cero y top vacio', async () => {
    extractor.keywords = [];

    const result = await useCase.execute(GRADUATE, ['texto sin diccionario'], false);

    expect(result.status).toBe('empty');
    expect(result.hasLaborHistory).toBe(false);
    expect(
      result.areas.every((area) => area.affinity === 0 && area.topKeywords.length === 0),
    ).toBe(true);
  });

  it('si falla la persistencia no deja ninguna fila guardada', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];
    repository.failOnSave = true;

    await expect(useCase.execute(GRADUATE, ['javascript'], true)).rejects.toThrow(
      'fallo de persistencia simulado',
    );

    expect(repository.savedCalculations).toHaveLength(0);
  });

  it('sin diccionario no persiste nada, ni siquiera un calculo VACIO', async () => {
    extractor.failWithDictionaryError = true;

    await expect(useCase.execute(GRADUATE, ['javascript'], true)).rejects.toBeInstanceOf(
      KeywordDictionaryUnavailableError,
    );

    expect(repository.saveCalls).toBe(0);
    expect(repository.savedCalculations).toHaveLength(0);
  });

  it('dos llamadas concurrentes con el mismo perfil generan un unico calculo', async () => {
    extractor.keywords = [{ term: 'javascript', count: 1 }];

    const [first, second] = await Promise.all([
      useCase.execute(GRADUATE, ['javascript'], true),
      useCase.execute(GRADUATE, ['javascript'], true),
    ]);

    expect(repository.saveCalls).toBe(1);
    expect(repository.savedCalculations).toHaveLength(1);
    expect([first.recalculated, second.recalculated].filter(Boolean)).toHaveLength(1);
    expect(findArea(first.areas, SOFTWARE).affinity).toBe(
      findArea(second.areas, SOFTWARE).affinity,
    );
  });
});
