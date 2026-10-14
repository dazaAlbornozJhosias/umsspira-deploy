// packages/shared-types/src/job-posting.ts

export interface JobPosting {
  id: string;
  titulo: string;
  modalidad: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';
  nivelExperiencia: string;
  descripcionTecnica: string;
  estado: 'PUBLICADO' | 'CERRADO';
  fechaCreacion: string;
  empresaId: string;
}