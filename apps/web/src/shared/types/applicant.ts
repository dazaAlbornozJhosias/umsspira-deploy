export const APPLICANT_STATUSES = [
  "Postulado",
  "En revisión",
  "Preseleccionado",
  "Entrevistado",
  "Descartado",
] as const;

export const EXPERIENCE_LEVELS = ["Junior", "Semi-Senior", "Senior"] as const;

export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface SkillMatch {
  skill: string;
  percentage: number;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  location: string;
  experienceLevel: ExperienceLevel;
  status: ApplicantStatus;
  /** Fecha de postulación en formato ISO (ej. "2025-09-10"). */
  appliedAt: string | null;
  /** Enlace de descarga del CV, si la API lo envía. */
  cvUrl: string | null;
  /**
   * Porcentaje devuelto por el motor de coincidencia (Epic 3/5).
   * El frontend NUNCA lo calcula. Si no viene, es null (CA-10).
   */
  matchPercentage: number | null;
  /** Desglose por habilidad devuelto por el motor. null o vacío = no disponible. */
  skills: SkillMatch[] | null;
}