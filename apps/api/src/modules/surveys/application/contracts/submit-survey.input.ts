export interface SubmitSurveyInput {
  idEncuesta: string;
  idTitulado: string;
  condicionLaboral: boolean;
  cargo?: string;
  empresa?: string;
  area?: string;
  modalidad?: string;
  salarioMensual?: string;
  tiempoInsercion?: string;
}
