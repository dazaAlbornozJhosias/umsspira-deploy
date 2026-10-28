import { useCallback, useState } from 'react';

/**
 * HU-EP09-01 / T1.2 (Anelis): estado de situación laboral.
 * El booleano coincide con condicion_laboral en la BD:
 * true = Trabaja; false = No trabaja; null = sin selección.
 */
export type SurveyWorkCondition = boolean | null;

export interface SurveyWorkFields {
  cargo: string;
  empresa: string;
  area: string;
  modalidad: string;
  salario_mensual: string;
  tiempo_insercion: string;
}

export interface SurveyFormValues extends SurveyWorkFields {
  condicion_laboral: SurveyWorkCondition;
}

export type SurveySubmissionPayload =
  | { condicion_laboral: false }
  | ({ condicion_laboral: true } & SurveyWorkFields);

const EMPTY_WORK_FIELDS: SurveyWorkFields = {
  cargo: '',
  empresa: '',
  area: '',
  modalidad: '',
  salario_mensual: '',
  tiempo_insercion: '',
};

const WORK_FIELD_NAMES: (keyof SurveyWorkFields)[] = [
  'cargo', 'empresa', 'area', 'modalidad', 'salario_mensual', 'tiempo_insercion',
];

/**
 * Normalización defensiva para integrar futuros borradores (T1.3).
 * Una respuesta «No trabaja» jamás conserva información laboral oculta,
 * aunque provenga de un borrador o de datos previamente escritos.
 */
export function createSurveyFormValues(input: Partial<SurveyFormValues> = {}): SurveyFormValues {
  const condicion_laboral = input.condicion_laboral === true
    ? true
    : input.condicion_laboral === false ? false : null;

  if (condicion_laboral !== true) {
    return { condicion_laboral, ...EMPTY_WORK_FIELDS };
  }

  const fields = { ...EMPTY_WORK_FIELDS };
  for (const key of WORK_FIELD_NAMES) {
    const value = input[key];
    if (typeof value === 'string') fields[key] = value;
  }

  return { condicion_laboral, ...fields };
}

/**
 * T1.2: con «No trabaja» enviamos solo la condición; el backend exige
 * que NO estén presentes los campos laborales, ni siquiera vacíos.
 * Las validaciones de obligatoriedad para «Trabaja» pertenecen a HU-002.
 */
export function toSurveySubmissionPayload(values: SurveyFormValues): SurveySubmissionPayload {
  if (values.condicion_laboral === null) {
    throw new Error('Debe seleccionar su condición laboral');
  }
  if (values.condicion_laboral === false) return { condicion_laboral: false };
  return {
    condicion_laboral: true,
    cargo: values.cargo,
    empresa: values.empresa,
    area: values.area,
    modalidad: values.modalidad,
    salario_mensual: values.salario_mensual,
    tiempo_insercion: values.tiempo_insercion,
  };
}

/**
 * Hook independiente de la UI de Natalie (T1.1), del autoguardado (T1.3)
 * y del envío HTTP (T3.4). El componente usa showWorkFields para renderizar
 * condicionalmente; setWorkCondition purga el estado de forma atómica.
 */
export function useSurveyForm(initialValues?: Partial<SurveyFormValues>) {
  const [values, setValues] = useState<SurveyFormValues>(() => createSurveyFormValues(initialValues));

  const setWorkCondition = useCallback((condition: SurveyWorkCondition) => {
    setValues((current) => {
      if (current.condicion_laboral === condition) return current;
      // También se purgan al volver a «Trabaja» tras haber elegido «No trabaja».
      return { condicion_laboral: condition, ...EMPTY_WORK_FIELDS };
    });
  }, []);

  const setWorkField = useCallback((field: keyof SurveyWorkFields, value: string) => {
    setValues((current) => {
      // Ignorar escrituras de inputs ocultos o efectos asíncronos antiguos.
      if (current.condicion_laboral !== true) return current;
      return { ...current, [field]: value };
    });
  }, []);

  const replaceValues = useCallback((next: Partial<SurveyFormValues>) => {
    setValues(createSurveyFormValues(next));
  }, []);

  const resetForm = useCallback(() => {
    setValues(createSurveyFormValues());
  }, []);

  const getSubmissionPayload = useCallback(
    () => toSurveySubmissionPayload(values),
    [values],
  );

  return {
    values,
    showWorkFields: values.condicion_laboral === true,
    canProceed: values.condicion_laboral !== null,
    setWorkCondition,
    setWorkField,
    replaceValues,
    resetForm,
    getSubmissionPayload,
  };
}
