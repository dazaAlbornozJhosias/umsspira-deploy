import type { ProfileSection } from '../../domain/entities/profile-record';

export interface ProfileScope {
  graduateId: string;
  userId: string;
}

export interface EducationInput {
  institucion: string;
  titulo: string;
  grado: string;
  anioEgreso: number;
}

export interface ExperienceInput {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface CertificationInput {
  nombre: string;
  entidadEmisora: string;
  grado: string;
  anioEmision: number;
}

export type ProfileChange =
  | { section: 'formacion-academica'; data: EducationInput }
  | { section: 'experiencia-laboral'; data: ExperienceInput }
  | { section: 'certificaciones'; data: CertificationInput };

export interface RecordReference {
  section: ProfileSection;
  id: string;
}
