// Máximo de caracteres de la descripción profesional (HU-06); el frontend usa el mismo límite
export const PROFESSIONAL_DESCRIPTION_MAX_LENGTH = 5000;

// Descripción profesional del titulado. Vive en perfil_area: una sola fila por titulado
export interface ProfessionalDescription {
  text: string;
  updatedAt: Date | null;
}
