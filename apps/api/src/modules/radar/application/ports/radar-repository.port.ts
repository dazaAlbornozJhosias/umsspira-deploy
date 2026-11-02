import { RadarArea } from '../../domain/entities/radar-area';
import type { KeywordContribution } from '../../domain/policies/affinity-calculator';

/**
 * Representa los datos calculados de un área del radar listos para almacenarse
 * en la tabla 'afinidad_radar' de la base de datos.
 */
export interface AreaScoreRecord {
  areaSlug: RadarArea;
  areaId: string;
  puntaje: number;
  porcentaje: number;
  ponderacion: number | null;
  // Detalle de las palabras clave que más aportaron al área (HU-8 / Explicabilidad)
  palabrasClaveTop: KeywordContribution[];
}

/**
 * Representa una instantánea completa de un cálculo de radar recuperado desde PostgreSQL.
 * Refleja las filas de las tablas 'calculo_radar' y 'afinidad_radar'.
 */
export interface RadarCalculationSnapshot {
  id: string;
  tituladoId: string;
  hashEntrada: string | null;
  estado: 'COMPLETADO' | 'VACIO';
  versionAlgoritmo: string;
  fechaCalculo: Date;
  afinidad: Array<{
    areaId: string;
    puntaje: number;
    porcentaje: number;
    ponderacion: number | null;
    palabrasClaveTop: KeywordContribution[];
  }>;
}

// Token de inyección de dependencias para el contenedor de NestJS
export const RADAR_REPOSITORY_PORT = Symbol('RADAR_REPOSITORY_PORT');

/**
 * Contrato de repositorio del módulo Radar (Arquitectura Hexagonal).
 * Orquesta la persistencia, consultas de historial, lectura de ponderaciones
 * y concurrencia transaccional.
 */
export interface RadarRepositoryPort {
  /**
   * Obtiene el cálculo más reciente del titulado.
   * Utilizado en GET /radar para verificar si el usuario ya cuenta con datos o requiere recálculo perezoso (Lazy).
   */
  getLatestCalculation(tituladoId: string): Promise<RadarCalculationSnapshot | null>;

  /**
   * Obtiene el cálculo inmediatamente anterior al actual.
   * Requerido para contrastar variaciones (+8%, -3%) y exponer el campo previousAffinity.
   */
  getPreviousCalculation(tituladoId: string, currentCalculationId: string): Promise<RadarCalculationSnapshot | null>;

  /**
   * Obtiene los términos no mapeados vigentes del titulado para exponerlos en la respuesta.
   */
  getUnmappedKeywords(tituladoId: string): Promise<string[]>;

  /**
   * Ejecuta una rutina dentro de un bloqueo asesor a nivel de transacción (pg_advisory_xact_lock).
   * Garantiza la serialización de peticiones simultáneas sobre el mismo titulado y evita registros duplicados.
   * La operación recibe un repositorio ligado a esa transacción: todas las lecturas y escrituras
   * deben hacerse con él para que el bloqueo cubra el cálculo completo.
   */
  executeWithAdvisoryLock<T>(
    tituladoId: string,
    operation: (repository: RadarRepositoryPort) => Promise<T>,
  ): Promise<T>;

  /**
   * Persiste de manera atómica en una sola transacción:
   * 1 fila en calculo_radar + 6 filas en afinidad_radar + sincronización de términos no mapeados.
   */
  saveCalculation(params: {
    tituladoId: string;
    hashEntrada: string;
    estado: 'COMPLETADO' | 'VACIO';
    versionAlgoritmo: string;
    areas: AreaScoreRecord[];
    unmapped: Array<{ term: string; count: number }>;
  }): Promise<RadarCalculationSnapshot>;

  /**
   * Consulta el catálogo de pesos asignados por área desde la tabla 'palabra_clave_area'.
   * La clave del registro es el UUID del área.
   */
  getAreaWeights(): Promise<Record<string, Array<{ term: string; peso: number }>>>;
}
