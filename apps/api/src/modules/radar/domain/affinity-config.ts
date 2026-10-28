import { RADAR_AREA_IDS, type RadarArea } from './entities/radar-area';

/** Orden canónico de los ejes del radar; también define el orden de respuesta. */
export const RADAR_AREAS: readonly RadarArea[] = Object.keys(RADAR_AREA_IDS) as RadarArea[];
export const AFFINITY_ALGORITHM_VERSION = '1.0.0';
export const MAX_KEYWORD_FREQUENCY = 3;
export const MAX_AFFINITY_SCORE = 100;
export const AFFINITY_PERCENTAGE_DECIMALS = 2;
export const AFFINITY_PERCENTAGE_FACTOR = 10 ** AFFINITY_PERCENTAGE_DECIMALS;
export const TOP_KEYWORDS_LIMIT = 5;
