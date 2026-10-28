import { Injectable, Inject } from '@nestjs/common';
import { 
  KEYWORD_EXTRACTOR_PORT, 
  KeywordExtractorPort 
} from '../ports/keyword-extractor.port';
import { 
  RADAR_REPOSITORY_PORT, 
  RadarRepositoryPort,
  AreaScoreRecord,
  RadarCalculationSnapshot
} from '../ports/radar-repository.port';
import { 
  UNMAPPED_KEYWORD_REPOSITORY_PORT, 
  UnmappedKeywordRepositoryPort 
} from '../ports/unmapped-keyword-repository.port';
import { calculateAreaAffinity } from '../../domain/policies/affinity-calculator';
import { ALGORITHM_VERSION } from '../../domain/policies/affinity-config';
import { RADAR_AREA_IDS, RadarArea } from '../../domain/entities/radar-area';

@Injectable()
export class RecalculateRadarUseCase {
  constructor(
    @Inject(KEYWORD_EXTRACTOR_PORT)
    private readonly keywordExtractor: KeywordExtractorPort,
    
    @Inject(RADAR_REPOSITORY_PORT)
    private readonly radarRepository: RadarRepositoryPort,
    
    @Inject(UNMAPPED_KEYWORD_REPOSITORY_PORT)
    private readonly unmappedKeywordRepository: UnmappedKeywordRepositoryPort
  ) {}

  async execute(tituladoId: string, currentHash: string, texts: string[]) {
    // 1. Bloqueo asesor transaccional (pg_advisory_xact_lock) por titulado.
    // Garantiza que si el front manda 2 clicks rápidos, no se duplique el cálculo.
    return await this.radarRepository.executeWithAdvisoryLock(tituladoId, async () => {
      
      // 2. Verificar Idempotencia: Si el hash no cambió, devolvemos el cálculo intacto.
      const latestCalc = await this.radarRepository.getLatestCalculation(tituladoId);
      if (latestCalc && latestCalc.hashEntrada === currentHash) {
        const previous = await this.radarRepository.getPreviousCalculation(tituladoId, latestCalc.id);
        return this.mapToResponse(latestCalc, previous, false); // recalculated = false
      }

      // 3. Extraer palabras clave usando el puerto NLP (Módulo de Nayra)
      const { keywords, unmapped } = await this.keywordExtractor.extractFromTexts(texts);

      // 4. Determinar el estado. Si no reconoció nada, va como VACIO (Regla de HU-2).
      const estado = keywords.length === 0 ? 'VACIO' : 'COMPLETADO';

      // 5. Cargar los pesos de la BD
      const areaWeights = await this.radarRepository.getAreaWeights();
      const areas: AreaScoreRecord[] = [];

      // 6. Calcular la afinidad aplicando saturación independiente por área
      const slugs = Object.keys(RADAR_AREA_IDS) as RadarArea[];
      for (const slug of slugs) {
        const areaId = RADAR_AREA_IDS[slug];
        const weightsForArea = areaWeights[areaId] || [];
        
        // Llamada a la función matemática pura de Ximena
        const areaResult = calculateAreaAffinity(keywords, weightsForArea);
        
        areas.push({
          areaSlug: slug,
          areaId,
          puntaje: areaResult.puntaje,
          porcentaje: areaResult.porcentaje,
          ponderacion: areaResult.ponderacion,
          palabrasClaveTop: areaResult.palabrasClaveTop, // Para la HU-4 (Variación)
        });
      }

      // 7. Persistir todo en una sola transacción atómica (Calculo + Afinidades)
      const newCalculation = await this.radarRepository.saveCalculation({
        tituladoId,
        hashEntrada: currentHash,
        estado,
        versionAlgoritmo: ALGORITHM_VERSION,
        areas,
        unmapped
      });

      // 8. Reemplazar las palabras no mapeadas del titulado (no se acumulan)
      await this.unmappedKeywordRepository.syncUnmappedKeywords(tituladoId, unmapped);

      // 9. Retornar el vector al Frontend
      const previousCalc = latestCalc; // El anterior es el que acabamos de reemplazar
      return this.mapToResponse(newCalculation, previousCalc, true); // recalculated = true
    });
  }

  /**
   * Mapea los datos para cumplir con el contrato AffinityVectorResponse
   */
  private mapToResponse(latestCalc: RadarCalculationSnapshot, previousCalc: RadarCalculationSnapshot | null, recalculated: boolean) {
    return {
      graduateId: latestCalc.tituladoId,
      calculatedAt: latestCalc.fechaCalculo.toISOString(),
      status: latestCalc.estado === 'VACIO' ? 'empty' : 'ok',
      algorithmVersion: latestCalc.versionAlgoritmo,
      hasPendingChanges: false, // Recién calculado, ya no hay pendientes
      recalculated,
      processingMs: 0,
      areas: latestCalc.afinidad.map((area) => {
        const previousArea = previousCalc?.afinidad.find((p) => p.areaId === area.areaId);
        return {
          area: area.areaId,
          affinity: area.porcentaje,
          previousAffinity: previousArea ? previousArea.porcentaje : null,
          weighting: area.ponderacion,
          topKeywords: area.palabrasClaveTop || [],
        };
      }),
      unmappedKeywords: [],
    };
  }
}