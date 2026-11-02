import type {
  AreaScoreRecord,
  RadarCalculationSnapshot,
  RadarRepositoryPort,
} from '../../src/modules/radar/application/ports/radar-repository.port';

interface SaveCalculationInput {
  tituladoId: string;
  hashEntrada: string;
  estado: 'COMPLETADO' | 'VACIO';
  versionAlgoritmo: string;
  areas: AreaScoreRecord[];
  unmapped: Array<{ term: string; count: number }>;
}

const INITIAL_CLOCK = Date.parse('2026-10-22T12:00:00.000Z');

/**
 * Repositorio en memoria para pruebas de casos de uso y HTTP.
 * Serializa executeWithAdvisoryLock como lo haría el lock de PostgreSQL para
 * poder observar el efecto de dos peticiones concurrentes.
 */
export class InMemoryRadarRepository implements RadarRepositoryPort {
  areaWeights: Record<string, Array<{ term: string; peso: number }>> = {};
  saveCalls = 0;
  failOnSave = false;
  private calculations: RadarCalculationSnapshot[] = [];
  private unmappedByGraduate = new Map<string, string[]>();
  private clock = INITIAL_CLOCK;
  private lock: Promise<void> = Promise.resolve();

  reset(): void {
    this.areaWeights = {};
    this.saveCalls = 0;
    this.failOnSave = false;
    this.calculations = [];
    this.unmappedByGraduate = new Map();
    this.clock = INITIAL_CLOCK;
    this.lock = Promise.resolve();
  }

  seedCalculation(snapshot: RadarCalculationSnapshot): void {
    this.calculations.push(snapshot);
    this.clock = Math.max(this.clock, snapshot.fechaCalculo.getTime());
  }

  seedUnmapped(tituladoId: string, terms: string[]): void {
    this.unmappedByGraduate.set(tituladoId, [...terms]);
  }

  get savedCalculations(): readonly RadarCalculationSnapshot[] {
    return this.calculations;
  }

  async getLatestCalculation(tituladoId: string): Promise<RadarCalculationSnapshot | null> {
    const own = this.calculations.filter((calculation) => calculation.tituladoId === tituladoId);
    return own.length === 0 ? null : own[own.length - 1];
  }

  async getPreviousCalculation(
    tituladoId: string,
    currentCalculationId: string,
  ): Promise<RadarCalculationSnapshot | null> {
    const own = this.calculations.filter((calculation) => calculation.tituladoId === tituladoId);
    const index = own.findIndex(({ id }) => id === currentCalculationId);

    return index > 0 ? own[index - 1] : null;
  }

  async getUnmappedKeywords(tituladoId: string): Promise<string[]> {
    return this.unmappedByGraduate.get(tituladoId) ?? [];
  }

  async executeWithAdvisoryLock<T>(
    _tituladoId: string,
    operation: (repository: RadarRepositoryPort) => Promise<T>,
  ): Promise<T> {
    const previous = this.lock;
    let release = (): void => undefined;
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    try {
      return await operation(this);
    } finally {
      release();
    }
  }

  async saveCalculation(params: SaveCalculationInput): Promise<RadarCalculationSnapshot> {
    if (this.failOnSave) {
      throw new Error('fallo de persistencia simulado');
    }

    this.saveCalls += 1;
    this.clock += 1000;
    const snapshot: RadarCalculationSnapshot = {
      id: `calculation-${this.saveCalls}`,
      tituladoId: params.tituladoId,
      hashEntrada: params.hashEntrada,
      estado: params.estado,
      versionAlgoritmo: params.versionAlgoritmo,
      fechaCalculo: new Date(this.clock),
      afinidad: params.areas.map((area) => ({
        areaId: area.areaId,
        puntaje: area.puntaje,
        porcentaje: area.porcentaje,
        ponderacion: area.ponderacion,
        palabrasClaveTop: area.palabrasClaveTop,
      })),
    };

    this.calculations.push(snapshot);
    this.unmappedByGraduate.set(
      params.tituladoId,
      params.unmapped.map(({ term }) => term),
    );

    return snapshot;
  }

  async getAreaWeights(): Promise<Record<string, Array<{ term: string; peso: number }>>> {
    return this.areaWeights;
  }
}
