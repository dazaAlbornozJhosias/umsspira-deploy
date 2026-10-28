export const JOB_MODALITIES = ['PRESENCIAL', 'HIBRIDO', 'REMOTO'] as const;
export type JobModality = (typeof JOB_MODALITIES)[number];

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  modality: JobModality;
  experienceLevel: string;
  technicalDescription: string;
  status: 'PUBLICADO' | 'CERRADO';
  createdAt: Date;
}
