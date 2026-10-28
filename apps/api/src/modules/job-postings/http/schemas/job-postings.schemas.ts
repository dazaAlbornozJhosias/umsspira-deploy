import { z } from 'zod';
import { JOB_MODALITIES } from '../../domain/entities/job-posting.entity';

export const createJobPostingSchema = z
  .object({
    empresaId: z.uuid(),
    titulo: z.string().trim().min(1).max(150),
    modalidad: z.enum(JOB_MODALITIES),
    nivelExperiencia: z.string().trim().min(1).max(100),
    descripcionTecnica: z.string().trim().min(50).max(20000),
  })
  .strict();

export type CreateJobPostingBody = z.output<typeof createJobPostingSchema>;
