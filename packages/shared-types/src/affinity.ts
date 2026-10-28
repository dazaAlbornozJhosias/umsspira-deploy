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

export interface AffinityAreaScore {
  area: AffinityArea;
  // Porcentaje de afinidad de 0 a 100 (la BD guarda NUMERIC(5,2))
  affinity: number;
}

export interface AffinityVectorResponse {
  graduateId: string;
  calculatedAt: string;
  // Siempre 6 Ã¡reas, en el orden fijo definido en la HU-2
  areas: AffinityAreaScore[];
}

