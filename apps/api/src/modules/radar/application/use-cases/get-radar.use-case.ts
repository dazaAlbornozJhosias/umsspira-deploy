import { Inject, Injectable } from '@nestjs/common';
import {
  PROFILE_TEXT_READER_PORT,
  ProfileTextReaderPort,
} from '../ports/profile-text-reader.port';
import {
  RADAR_REPOSITORY_PORT,
  RadarRepositoryPort,
} from '../ports/radar-repository.port';
import { calculateInputHash } from '../../domain/policies/input-hash';
import { buildRadarVector } from '../services/radar-vector.builder';
import { RecalculateRadarUseCase } from './recalculate-radar.use-case';
import type { RadarVector } from '../contracts/radar-vector';

@Injectable()
export class GetRadarUseCase {
  constructor(
    @Inject(PROFILE_TEXT_READER_PORT)
    private readonly profileTextReader: ProfileTextReaderPort,

    @Inject(RADAR_REPOSITORY_PORT)
    private readonly radarRepository: RadarRepositoryPort,

    // Se usa para la carga perezosa (lazy GET) cuando el titulado aún no tiene cálculo.
    private readonly recalculateRadarUseCase: RecalculateRadarUseCase,
  ) {}

  async execute(tituladoId: string): Promise<RadarVector> {
    // 1. Leer los textos actuales de las 4 fuentes del titulado.
    const profileTexts = await this.profileTextReader.getProfileTexts(tituladoId);

    // 2. Hash de entrada con la misma fórmula que el recálculo.
    const currentHash = calculateInputHash(profileTexts.texts);

    // 3. Buscar si el titulado ya tiene un cálculo previo en la base de datos.
    const latestCalc = await this.radarRepository.getLatestCalculation(tituladoId);

    // 4. Carga perezosa: si no hay cálculo, se crea en este instante.
    if (!latestCalc) {
      const calculated = await this.recalculateRadarUseCase.execute(
        tituladoId,
        profileTexts.texts,
        profileTexts.hasLaborHistory,
      );

      // GET no expone el indicador de recalculado; solo pertenece a POST /recalculate.
      delete calculated.recalculated;
      return calculated;
    }

    // 5. Si ya existe, se informa si el perfil cambió comparando el hash guardado.
    // Un hash nulo (datos demo del seed) cuenta automáticamente como cambio pendiente.
    const hasPendingChanges = !latestCalc.hashEntrada || latestCalc.hashEntrada !== currentHash;

    // 6. El cálculo inmediatamente anterior permite calcular previousAffinity.
    const [previousCalc, unmappedKeywords] = await Promise.all([
      this.radarRepository.getPreviousCalculation(tituladoId, latestCalc.id),
      this.radarRepository.getUnmappedKeywords(tituladoId),
    ]);

    return buildRadarVector({
      calculation: latestCalc,
      previous: previousCalc,
      hasLaborHistory: profileTexts.hasLaborHistory,
      hasPendingChanges,
      processingMs: 0, // El GET devuelve al instante; el frontend mide el tiempo de red.
      unmappedKeywords,
    });
  }
}
