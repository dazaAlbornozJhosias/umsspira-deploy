export const AFFINITY_AREAS = [
  "software-development",
  "cloud-devops",
  "data-ai",
  "quality-assurance",
  "cybersecurity-networks",
  "it-management",
] as const;

export type AffinityArea = (typeof AFFINITY_AREAS)[number];

export interface AffinityAreaScore {
  area: AffinityArea;
  // Porcentaje de afinidad de 0 a 100 (la BD guarda NUMERIC(5,2))
  affinity: number;
}

export interface AffinityVectorResponse {
  graduateId: string;
  calculatedAt: string;
  // Siempre 6 áreas, en el orden fijo definido en la HU-2
  areas: AffinityAreaScore[];
}