import { Inject, Injectable } from '@nestjs/common';
import {
  KEYWORD_EXTRACTOR_PORT,
  KeywordExtractorPort,
} from '../ports/keyword-extractor.port';
import {
  RADAR_REPOSITORY_PORT,
  RadarRepositoryPort,
  AreaScoreRecord,
} from '../ports/radar-repository.port';
import { calculateAreaAffinity } from '../../domain/policies/affinity-calculator';
import { ALGORITHM_VERSION } from '../../domain/policies/affinity-config';
import { calculateInputHash } from '../../domain/policies/input-hash';
import { RADAR_AREA_IDS, RadarArea } from '../../domain/entities/radar-area';
import { buildRadarVector } from '../services/radar-vector.builder';
import type { RadarVector } from '../contracts/radar-vector';

@Injectable()
export class RecalculateRadarUseCase {
  constructor(
    @Inject(KEYWORD_EXTRACTOR_PORT)
    private readonly keywordExtractor: KeywordExtractorPort,

    @Inject(RADAR_REPOSITORY_PORT)
    private readonly radarRepository: RadarRepositoryPort,
  ) {}

  async execute(
    tituladoId: string,
    texts: readonly string[],
    hasLaborHistory: boolean,
  ): Promise<RadarVector> {
    const currentHash = calculateInputHash(texts);
    const startedAt = Date.now();

    // Bloqueo asesor transaccional (pg_advisory_xact_lock) por titulado.
    // Garantiza que si el front manda 2 clicks rápidos, no se duplique el cálculo.
    return this.radarRepository.executeWithAdvisoryLock(tituladoId, async (repository) => {
      // Verificar idempotencia: si el hash no cambió, devolvemos el cálculo intacto.
      const latestCalc = await repository.getLatestCalculation(tituladoId);

      if (latestCalc && latestCalc.hashEntrada === currentHash) {
        // CA-HU8-11: la referencia sigue siendo el cálculo anterior al vigente,
        // no el cálculo vigente consigo mismo.
        const previous = await repository.getPreviousCalculation(tituladoId, latestCalc.id);
        const unmappedKeywords = await repository.getUnmappedKeywords(tituladoId);

        return buildRadarVector({
          calculation: latestCalc,
          previous,
          hasLaborHistory,
          hasPendingChanges: false,
          recalculated: false,
          processingMs: Date.now() - startedAt,
          unmappedKeywords,
        });
      }

      // Extraer palabras clave usando el puerto NLP. Si el diccionario no está disponible
      // lanza un error y la transacción se revierte sin persistir nada.
      const { keywords, unmapped } = await this.keywordExtractor.extractFromTexts([...texts]);

      // Si no reconoció nada, el cálculo queda como VACIO con las seis áreas en cero.
      const estado = keywords.length === 0 ? 'VACIO' : 'COMPLETADO';

      // Cargar los pesos de la base de datos.
      const areaWeights = await repository.getAreaWeights();
      const slugs = Object.keys(RADAR_AREA_IDS) as RadarArea[];
      const areas: AreaScoreRecord[] = [];

      for (const slug of slugs) {
        const areaId = RADAR_AREA_IDS[slug];
        const areaResult = calculateAreaAffinity(keywords, areaWeights[areaId] ?? []);

        areas.push({
          areaSlug: slug,
          areaId,
          puntaje: areaResult.puntaje,
          porcentaje: areaResult.porcentaje,
          ponderacion: areaResult.ponderacion,
          palabrasClaveTop: areaResult.palabrasClaveTop,
        });
      }

      // Persistir cálculo, seis afinidades y no mapeados en una sola transacción atómica.
      const newCalculation = await repository.saveCalculation({
        tituladoId,
        hashEntrada: currentHash,
        estado,
        versionAlgoritmo: ALGORITHM_VERSION,
        areas,
        unmapped,
      });

      return buildRadarVector({
        calculation: newCalculation,
        // El anterior es el cálculo que acabamos de reemplazar.
        previous: latestCalc,
        hasLaborHistory,
        hasPendingChanges: false,
        recalculated: true,
        processingMs: Date.now() - startedAt,
        unmappedKeywords: unmapped.map(({ term }) => term),
      });
    });
  }
}
