import type { Prisma } from '../../../../generated/prisma/client';
import { AppError } from '../../../../shared/errors/app-error';
import {
  JOB_MODALITIES,
  type JobModality,
  type JobPosting,
} from '../../domain/entities/job-posting.entity';

export const jobPostingSelect = {
  id: true,
  id_empresa: true,
  titulo: true,
  modalidad: true,
  nivel_experiencia: true,
  descripcion_tecnica: true,
  estado: true,
  created_at: true,
} satisfies Prisma.VacanteSelect;

type JobPostingRecord = Prisma.VacanteGetPayload<{ select: typeof jobPostingSelect }>;

export function toJobPosting(record: JobPostingRecord): JobPosting {
  if (
    record.id_empresa === null ||
    record.titulo === null ||
    record.modalidad === null ||
    !JOB_MODALITIES.includes(record.modalidad as JobModality) ||
    record.nivel_experiencia === null ||
    record.descripcion_tecnica === null ||
    record.created_at === null ||
    (record.estado !== 'PUBLICADO' && record.estado !== 'CERRADO')
  ) {
    throw new AppError('INVALID_JOB_POSTING_RECORD', 'La vacante almacenada está incompleta');
  }
  return {
    id: record.id,
    companyId: record.id_empresa,
    title: record.titulo,
    modality: record.modalidad as JobModality,
    experienceLevel: record.nivel_experiencia,
    technicalDescription: record.descripcion_tecnica,
    status: record.estado,
    createdAt: record.created_at,
  };
}
