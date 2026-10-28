/** Requisitos de activación de HU 6.1. `egresado` significa titulado aprobado. */
export type ConditionId = 'egresado';
export type Requirements = Record<ConditionId, boolean>;

export interface MentorState {
  isActive: boolean;
  requirements: Requirements;
}

export interface MentorDirectoryArea {
  id: string;
  nombre: string;
}

/** Respuesta pública de GET /api/v1/mentorship/profiles (HU 6.7). */
export interface MentorDirectoryResponse {
  data: {
    id: string;
    nombre: string;
    descripcion: string | null;
    foto_perfil: string | null;
    esta_activo: boolean | null;
    areas: MentorDirectoryArea[];
    availabilityStatus: 'AVAILABLE' | 'PAUSED' | 'UNAVAILABLE' | null;
    cargo: string | null;
    empresa: string | null;
    intereses: (MentorDirectoryArea & { area: MentorDirectoryArea })[];
  }[];
  total: number;
  catalog: { area: MentorDirectoryArea; intereses: MentorDirectoryArea[] }[];
}
