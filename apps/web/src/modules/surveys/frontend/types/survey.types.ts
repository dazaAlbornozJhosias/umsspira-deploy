export type WorkCondition = 'works' | 'not-works';

export type WorkModality = 'presencial' | 'remoto' | 'hibrido';

/**
 * Borrador de la encuesta. Cargo, empresa, área y modalidad se guardan en localStorage.
 * Salario e inserción son confidenciales: solo viven en sessionStorage (se borran al cerrar
 * la pestaña, al enviar o al cerrar sesión).
 */
export interface SurveyDraft {
  workCondition: WorkCondition;
  cargo?: string;
  empresa?: string;
  area?: string;
  modalidad?: WorkModality;
  salario_mensual?: string;
  tiempo_insercion?: string;
}