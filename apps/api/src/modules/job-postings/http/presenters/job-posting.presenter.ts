import type { JobPosting } from '../../domain/entities/job-posting.entity';

export function presentJobPosting(posting: JobPosting) {
  return {
    id: posting.id,
    titulo: posting.title,
    modalidad: posting.modality,
    nivelExperiencia: posting.experienceLevel,
    descripcionTecnica: posting.technicalDescription,
    estado: posting.status,
    fechaCreacion: posting.createdAt.toISOString(),
    empresaId: posting.companyId,
  };
}
