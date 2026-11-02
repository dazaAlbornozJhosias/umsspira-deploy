import { InMemoryRadarRepository } from '../../../../../test/adapters/in-memory-radar.repository';
import {
  StubKeywordExtractor,
  StubProfileTextReader,
} from '../../../../../test/adapters/in-memory-radar-ports';
import { RADAR_AREA_IDS, type RadarArea } from '../../domain/entities/radar-area';
import type { KeywordContribution } from '../../domain/policies/affinity-calculator';
import { calculateInputHash } from '../../domain/policies/input-hash';
import type { RadarCalculationSnapshot } from '../ports/radar-repository.port';
import type { RadarAreaVector } from '../contracts/radar-vector';
import { GetRadarUseCase } from './get-radar.use-case';
import { RecalculateRadarUseCase } from './recalculate-radar.use-case';

const SOFTWARE = RADAR_AREA_IDS['software-development'];
const GRADUATE = '10000000-0000-4000-8000-000000000002';
const VERSION = '1.0.0/2026-10-22.1';

function buildSnapshot(params: {
  id: string;
  hashEntrada: string | null;
  fechaCalculo: string;
  percentages?: Partial<Record<RadarArea, number>>;
  topKeywords?: KeywordContribution[];
}): RadarCalculationSnapshot {
  return {
    id: params.id,
    tituladoId: GRADUATE,
    hashEntrada: params.hashEntrada,
    estado: 'COMPLETADO',
    versionAlgoritmo: VERSION,
    fechaCalculo: new Date(params.fechaCalculo),
    afinidad: (Object.keys(RADAR_AREA_IDS) as RadarArea[]).map((area) => ({
      areaId: RADAR_AREA_IDS[area],
      puntaje: params.percentages?.[area] ?? 0,
      porcentaje: params.percentages?.[area] ?? 0,
      ponderacion: null,
      palabrasClaveTop: area === 'software-development' ? (params.topKeywords ?? []) : [],
    })),
  };
}

function findArea(areas: RadarAreaVector[], areaId: string): RadarAreaVector {
  const found = areas.find((area) => area.areaId === areaId);

  if (!found) {
    throw new Error(`No se encontro el area ${areaId}`);
  }

  return found;
}

describe('GetRadarUseCase - lectura de keywords y afinidad previa', () => {
  let repository: InMemoryRadarRepository;
  let reader: StubProfileTextReader;
  let extractor: StubKeywordExtractor;
  let useCase: GetRadarUseCase;

  beforeEach(() => {
    repository = new InMemoryRadarRepository();
    repository.areaWeights = {
      [SOFTWARE]: [{ term: 'javascript', peso: 5 }],
    };
    reader = new StubProfileTextReader();
    extractor = new StubKeywordExtractor();
    useCase = new GetRadarUseCase(
      reader,
      repository,
      new RecalculateRadarUseCase(extractor, repository),
    );
  });

  it('sin calculo previo hace carga perezosa y devuelve previousAffinity null', async () => {
    reader.texts = ['javascript'];
    reader.hasLaborHistory = false;
    extractor.keywords = [{ term: 'javascript', count: 1 }];

    const result = await useCase.execute(GRADUATE);

    expect(result).not.toHaveProperty('recalculated');
    expect(result.hasLaborHistory).toBe(false);
    expect(result.areas.every((area) => area.previousAffinity === null)).toBe(true);
    expect(findArea(result.areas, SOFTWARE)).toMatchObject({
      affinity: 12.5,
      topKeywords: [{ keyword: 'javascript', weight: 5, frequency: 1, points: 5 }],
    });
    expect(repository.saveCalls).toBe(1);
  });

  it('devuelve el top guardado y el porcentaje del calculo inmediatamente anterior', async () => {
    const contribution: KeywordContribution = {
      keyword: 'javascript',
      weight: 5,
      frequency: 1,
      points: 5,
      percentage: 12.5,
    };
    repository.seedCalculation(
      buildSnapshot({
        id: 'calculation-1',
        hashEntrada: 'hash-anterior',
        fechaCalculo: '2026-10-22T10:00:00.000Z',
        percentages: { 'software-development': 5 },
      }),
    );
    repository.seedCalculation(
      buildSnapshot({
        id: 'calculation-2',
        hashEntrada: calculateInputHash(['javascript']),
        fechaCalculo: '2026-10-22T12:00:00.000Z',
        percentages: { 'software-development': 12.5 },
        topKeywords: [contribution],
      }),
    );
    repository.seedUnmapped(GRADUATE, ['xylophone']);
    reader.texts = ['javascript'];

    const result = await useCase.execute(GRADUATE);

    expect(result.hasPendingChanges).toBe(false);
    expect(result.calculatedAt).toEqual(new Date('2026-10-22T12:00:00.000Z'));
    expect(result.unmappedKeywords).toEqual(['xylophone']);
    expect(findArea(result.areas, SOFTWARE)).toMatchObject({
      affinity: 12.5,
      previousAffinity: 5,
      weighting: 5,
      topKeywords: [contribution],
    });
    expect(repository.saveCalls).toBe(0);
  });

  it('una fila antigua sin palabras_clave_top devuelve arreglo vacio', async () => {
    repository.seedCalculation(
      buildSnapshot({
        id: 'calculation-legacy',
        hashEntrada: calculateInputHash(['javascript']),
        fechaCalculo: '2026-10-22T12:00:00.000Z',
        percentages: { 'software-development': 0 },
        topKeywords: [],
      }),
    );
    reader.texts = ['javascript'];

    const result = await useCase.execute(GRADUATE);

    expect(findArea(result.areas, SOFTWARE)).toEqual({
      areaId: SOFTWARE,
      affinity: 0,
      previousAffinity: null,
      weighting: null,
      topKeywords: [],
    });
  });

  it('marca cambios pendientes cuando el hash guardado no coincide o es nulo', async () => {
    repository.seedCalculation(
      buildSnapshot({
        id: 'calculation-1',
        hashEntrada: null,
        fechaCalculo: '2026-10-22T12:00:00.000Z',
      }),
    );
    reader.texts = ['javascript'];

    const result = await useCase.execute(GRADUATE);

    expect(result.hasPendingChanges).toBe(true);
  });
});
