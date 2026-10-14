import {
  AFFINITY_AREAS,
  type AffinityArea,
  type AffinityAreaScore,
} from '@umsspira/shared-types/src/affinity';

/** Punto de afinidad que puede traer la etiqueta en texto (mock o backend) o el id oficial. */
export interface RawAreaPoint {
  area: string;
  affinity: number;
}

const ETIQUETAS_A_ID: Record<string, AffinityArea> = {
  'desarrollo de software': 'software-development',
  'cloud & devops': 'cloud-devops',
  'ciencia de datos & ia': 'data-ai',
  'aseguramiento de calidad (qa)': 'quality-assurance',
  'ciberseguridad y redes': 'cybersecurity-networks',
  'gestion de ti & gobernanza': 'it-management',
};

const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const esIdOficial = (valor: string): valor is AffinityArea =>
  (AFFINITY_AREAS as readonly string[]).includes(valor);

/**
 * Convierte puntos con etiqueta en texto a los ids oficiales de las áreas.
 * Los ids que ya son oficiales pasan sin cambios; las etiquetas desconocidas se descartan
 * para que una respuesta mal formada no rompa el radar.
 */
export function toAffinityAreaScores(points: RawAreaPoint[]): AffinityAreaScore[] {
  return points.reduce<AffinityAreaScore[]>((resultado, punto) => {
    const clave = normalizar(punto.area);
    const id = esIdOficial(clave) ? clave : ETIQUETAS_A_ID[clave];
    if (id) {
      resultado.push({ area: id, affinity: punto.affinity });
    }
    return resultado;
  }, []);
}