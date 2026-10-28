export type WorkModality = 'Presencial' | 'Remoto' | 'Hibrido';

export interface SurveyJobFormValues {
  cargo: string;
  empresa: string;
  area: string;
  modalidad: WorkModality | null;
}

export interface SurveyJobFormErrors {
  cargo?: string;
  empresa?: string;
  area?: string;
  modalidad?: string;
}

export interface SurveyJobFormTouched {
  cargo?: boolean;
  empresa?: boolean;
  area?: boolean;
  modalidad?: boolean;
}

export interface SurveyJobInputsProps {
  values: SurveyJobFormValues;
  errors: SurveyJobFormErrors;
  touched: SurveyJobFormTouched;
  onChange: <K extends keyof SurveyJobFormValues>(field: K, value: SurveyJobFormValues[K]) => void;
  onBlur: (field: keyof SurveyJobFormValues) => void;
  disabled?: boolean;
}