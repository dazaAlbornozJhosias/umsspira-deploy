export interface ParticipationInput {
  esta_activo: boolean;
  experiencia?: string;
  anios_exp?: number;
}

export interface MentorInformationInput {
  descripcion?: string;
  experiencia: string;
  informacion_relevante?: string | null;
  foto_perfil?: string | null;
  anios_exp?: number;
}

export interface MentorAreasInput {
  areaIds: string[];
}

export interface MentorInterestsInput {
  ids: string[];
}

export interface MentorAvailabilityInput {
  availabilityStatus: 'DISPONIBLE' | 'EN_PAUSA' | 'NO_DISPONIBLE';
}
