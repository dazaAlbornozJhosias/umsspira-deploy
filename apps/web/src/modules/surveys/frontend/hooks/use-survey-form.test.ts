import { act, renderHook } from '@testing-library/react';
import {
  createSurveyFormValues,
  toSurveySubmissionPayload,
  useSurveyForm,
} from './use-survey-form';

const employment = {
  cargo: 'Analista de Sistemas',
  empresa: 'Empresa UMSS',
  area: 'Tecnología',
  modalidad: 'Remoto',
  salario_mensual: 'Bs 3.000 a Bs 5.000',
  tiempo_insercion: 'De 3 a 6 meses',
};

describe('HU-EP09-01 / T1.2: formulario condicional (Anelis)', () => {
  it('inicia sin selección y no permite avanzar ni enviar', () => {
    const { result } = renderHook(() => useSurveyForm());
    expect(result.current.values.condicion_laboral).toBeNull();
    expect(result.current.showWorkFields).toBe(false);
    expect(result.current.canProceed).toBe(false);
    expect(() => result.current.getSubmissionPayload()).toThrow(
      'Debe seleccionar su condición laboral',
    );
  });

  it('seleccionar Trabaja muestra inmediatamente los campos laborales', () => {
    const { result } = renderHook(() => useSurveyForm());
    act(() => result.current.setWorkCondition(true));
    expect(result.current.values.condicion_laboral).toBe(true);
    expect(result.current.showWorkFields).toBe(true);
    expect(result.current.canProceed).toBe(true);
  });

  it('con Trabaja mantiene las seis respuestas visibles para su envío', () => {
    const { result } = renderHook(() => useSurveyForm());
    act(() => {
      result.current.setWorkCondition(true);
    });
    act(() => {
      for (const [key, value] of Object.entries(employment)) {
        result.current.setWorkField(key as keyof typeof employment, value);
      }
    });
    expect(result.current.getSubmissionPayload()).toEqual({
      condicion_laboral: true,
      ...employment,
    });
  });

  it('pasar de Trabaja a No trabaja purga TODOS los campos en la misma actualización', () => {
    const { result } = renderHook(() => useSurveyForm({
      condicion_laboral: true,
      ...employment,
    }));
    act(() => result.current.setWorkCondition(false));
    expect(result.current.showWorkFields).toBe(false);
    expect(result.current.canProceed).toBe(true);
    for (const key of Object.keys(employment) as (keyof typeof employment)[]) {
      expect(result.current.values[key]).toBe('');
    }
    expect(result.current.getSubmissionPayload()).toEqual({ condicion_laboral: false });
  });

  it('volver a Trabaja no recupera las respuestas previamente purgadas', () => {
    const { result } = renderHook(() => useSurveyForm({
      condicion_laboral: true,
      ...employment,
    }));
    act(() => result.current.setWorkCondition(false));
    act(() => result.current.setWorkCondition(true));
    expect(result.current.showWorkFields).toBe(true);
    for (const key of Object.keys(employment) as (keyof typeof employment)[]) {
      expect(result.current.values[key]).toBe('');
    }
  });

  it('ignora una escritura tardía sobre campos ocultos', () => {
    const { result } = renderHook(() => useSurveyForm());
    act(() => result.current.setWorkCondition(false));
    act(() => result.current.setWorkField('salario_mensual', 'Más de Bs 12.000'));
    expect(result.current.values.salario_mensual).toBe('');
    expect(result.current.getSubmissionPayload()).toEqual({ condicion_laboral: false });
  });

  it('reseleccionar Trabaja sin cambiar de condición no borra lo escrito', () => {
    const { result } = renderHook(() => useSurveyForm());
    act(() => result.current.setWorkCondition(true));
    act(() => result.current.setWorkField('empresa', 'Conservada'));
    act(() => result.current.setWorkCondition(true));
    expect(result.current.values.empresa).toBe('Conservada');
  });

  it('normaliza un borrador No trabaja y descarta campos laborales ocultos', () => {
    const unsafe = createSurveyFormValues({ condicion_laboral: false, ...employment });
    expect(toSurveySubmissionPayload(unsafe)).toEqual({ condicion_laboral: false });
    for (const key of Object.keys(employment) as (keyof typeof employment)[]) {
      expect(unsafe[key]).toBe('');
    }
  });

  it('permite reemplazar valores al integrar el borrador T1.3, pero sanea el estado', () => {
    const { result } = renderHook(() => useSurveyForm());
    act(() => result.current.replaceValues({ condicion_laboral: true, ...employment }));
    expect(result.current.values.empresa).toBe('Empresa UMSS');
    act(() => result.current.replaceValues({ condicion_laboral: false, ...employment }));
    expect(result.current.values.empresa).toBe('');
    expect(result.current.getSubmissionPayload()).toEqual({ condicion_laboral: false });
  });

  it('al deseleccionar la condición y al reiniciar, borra las respuestas', () => {
    const { result } = renderHook(() => useSurveyForm({ condicion_laboral: true, ...employment }));
    act(() => result.current.setWorkCondition(null));
    expect(result.current.canProceed).toBe(false);
    expect(result.current.values.cargo).toBe('');
    act(() => result.current.setWorkCondition(true));
    act(() => result.current.setWorkField('cargo', 'Nuevo cargo'));
    act(() => result.current.resetForm());
    expect(result.current.values).toEqual(createSurveyFormValues());
  });
});
