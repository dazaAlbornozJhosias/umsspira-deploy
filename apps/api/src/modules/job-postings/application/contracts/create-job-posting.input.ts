import type { JobModality } from '../../domain/entities/job-posting.entity';

export interface CreateJobPostingInput {
  empresaId: string;
  titulo: string;
  modalidad: JobModality;
  nivelExperiencia: string;
  descripcionTecnica: string;
}
