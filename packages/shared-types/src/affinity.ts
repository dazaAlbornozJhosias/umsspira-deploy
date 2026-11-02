export const AFFINITY_AREAS = [
  "software-development",
  "cloud-devops",
  "data-ai",
  "quality-assurance",
  "cybersecurity-networks",
  "it-management",
] as const;

export type AffinityArea = (typeof AFFINITY_AREAS)[number];

export const RADAR_AREA_IDS = {
  "software-development": "60000000-0000-4000-8000-000000000003",
  "cloud-devops": "60000000-0000-4000-8000-000000000006",
  "data-ai": "60000000-0000-4000-8000-000000000007",
  "quality-assurance": "60000000-0000-4000-8000-000000000008",
  "cybersecurity-networks": "60000000-0000-4000-8000-000000000009",
  "it-management": "60000000-0000-4000-8000-000000000010",
} as const;

export type RadarArea = keyof typeof RADAR_AREA_IDS;

/**
 * Aporte individual de una palabra clave al puntaje de un area.
 * `frequency` conserva las menciones reales; `points` aplica el tope de
 * frecuencia del algoritmo (3) y `percentage` se normaliza sobre 40.
 */
export interface AffinityKeywordContribution {
  keyword: string;
  weight: number;
  frequency: number;
  points: number;
  percentage: number;
}

export interface AffinityAreaScore {
  area: AffinityArea;
  // Porcentaje de afinidad de 0 a 100 (la BD guarda NUMERIC(5,2)).
  affinity: number;
  // Afinidad del mismo eje en el calculo inmediatamente anterior. Null en el primero.
  // Opcional en el tipo compartido para no romper el frontend anterior a T4.2; la API siempre lo envia.
  previousAffinity?: number | null;
  // Mayor peso detectado en el area (1 a 5). Null cuando no hay aportes.
  // Opcional en el tipo compartido por compatibilidad con el frontend anterior a T4.2.
  weighting?: number | null;
  // Maximo cinco keywords con aporte positivo, ordenadas de mayor a menor aporte.
  // Opcional en el tipo compartido por compatibilidad con el frontend anterior a T4.2.
  topKeywords?: AffinityKeywordContribution[];
}

export interface AffinityVectorResponse {
  graduateId: string;
  // Opcionales en el tipo compartido por compatibilidad con el frontend anterior a T4.2.
  // La API siempre devuelve todos los campos.
  hasLaborHistory?: boolean;
  calculatedAt: string;
  // "empty" cuando el calculo no reconocio ninguna palabra clave.
  status?: "ok" | "empty";
  algorithmVersion?: string;
  hasPendingChanges?: boolean;
  // Solo lo devuelve POST /radar/recalculate.
  recalculated?: boolean;
  processingMs?: number;
  // Siempre 6 areas, en el orden fijo de AFFINITY_AREAS.
  areas: AffinityAreaScore[];
  unmappedKeywords?: string[];
}

export const AFFINITY_AREA_LABELS: Record<AffinityArea, string> = {
  'software-development': 'Desarrollo de Software',
  'cloud-devops': 'Cloud, DevOps & Infraestructura',
  'data-ai': 'Ciencia de Datos & IA',
  'quality-assurance': 'Aseguramiento de Calidad (QA)',
  'cybersecurity-networks': 'Ciberseguridad & Redes',
  'it-management': 'Gestión de TI & Gobernanza',
};

export const AFFINITY_AREA_SHORT_LABELS: Record<AffinityArea, string> = {
  'software-development': 'Desarrollo de Software',
  'cloud-devops': 'Cloud/Devops',
  'data-ai': 'Ciencia de Datos/IA',
  'quality-assurance': 'QA',
  'cybersecurity-networks': 'Ciberseguridad',
  'it-management': 'Gestión TI',
};
