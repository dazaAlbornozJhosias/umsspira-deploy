import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { 
  PROFILE_TEXT_READER_PORT, 
  ProfileTextReaderPort 
} from '../ports/profile-text-reader.port';
import { 
  RADAR_REPOSITORY_PORT, 
  RadarRepositoryPort, 
  RadarCalculationSnapshot
} from '../ports/radar-repository.port';
import { ALGORITHM_VERSION } from '../../domain/policies/affinity-config';
import { RecalculateRadarUseCase } from './recalculate-radar.use-case';

@Injectable()
export class GetRadarUseCase {
  constructor(
    @Inject(PROFILE_TEXT_READER_PORT)
    private readonly profileTextReader: ProfileTextReaderPort,
    
    @Inject(RADAR_REPOSITORY_PORT)
    private readonly radarRepository: RadarRepositoryPort,
    
    // Inyectamos el caso de uso de recalcular para usarlo en la carga perezosa (Lazy GET)
    private readonly recalculateRadarUseCase: RecalculateRadarUseCase
  ) {}

  async execute(tituladoId: string) {
    // 1. Leer los textos actuales de las 4 fuentes del titulado
    const profileTexts = await this.profileTextReader.getProfileTexts(tituladoId);

    // 2. Normalizar y ordenar los textos para el hash
    // Se ordenan para que cambiar el orden de las certificaciones no altere el hash
    const textToHash = profileTexts.texts
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .sort()
      .join('|');

    // 3. Calcular el hash de entrada (SHA-256)
    const currentHash = createHash('sha256')
      .update(`${ALGORITHM_VERSION}|${textToHash}`)
      .digest('hex');

    // 4. Buscar si el titulado ya tiene un cálculo previo en la BD
    const latestCalc = await this.radarRepository.getLatestCalculation(tituladoId);

    // 5. LÓGICA PEREZOSA (LAZY GET): Si no hay cálculo, lo creamos en este instante
    if (!latestCalc) {
      return await this.recalculateRadarUseCase.execute(tituladoId, currentHash, profileTexts.texts);
    }

    // 6. Si ya existe, comprobamos si el perfil cambió comparando el hash actual con el guardado
    // Si el hash guardado es null (datos demo del seed), cuenta automáticamente como cambio pendiente
    const hasPendingChanges = !latestCalc.hashEntrada || latestCalc.hashEntrada !== currentHash;

    // 7. Obtener el cálculo inmediatamente anterior para calcular previousAffinity (variación +8%/-3%)
    const previousCalc = await this.radarRepository.getPreviousCalculation(tituladoId, latestCalc.id);

    // 8. Devolver los datos formateados listos para el Presenter/Controller
    return this.mapToResponse(latestCalc, previousCalc, hasPendingChanges);
  }

  /**
   * Mapea los datos de la base de datos al contrato AffinityVectorResponse que espera el Frontend
   */
  private mapToResponse(
    latestCalc: RadarCalculationSnapshot, 
    previousCalc: RadarCalculationSnapshot | null, 
    hasPendingChanges: boolean
  ) {
    return {
      graduateId: latestCalc.tituladoId,
      calculatedAt: latestCalc.fechaCalculo.toISOString(),
      status: latestCalc.estado === 'VACIO' ? 'empty' : 'ok',
      algorithmVersion: latestCalc.versionAlgoritmo,
      hasPendingChanges, 
      processingMs: 0, // El GET devuelve al instante, se calculará el tiempo de red en el frontend
      
      areas: latestCalc.afinidad.map((area) => {
        // Buscar el porcentaje de esta misma área en el cálculo anterior (si existe)
        const previousArea = previousCalc?.afinidad.find((p) => p.areaId === area.areaId);
        
        return {
          area: area.areaId, // El controlador y presenter lo convertirán al slug final
          affinity: area.porcentaje,
          previousAffinity: previousArea ? previousArea.porcentaje : null,
          weighting: area.ponderacion,
          topKeywords: area.palabrasClaveTop || [],
        };
      }),
      unmappedKeywords: [], // En un GET simple de un radar existente, este arreglo no viaja al front
    };
  }
}