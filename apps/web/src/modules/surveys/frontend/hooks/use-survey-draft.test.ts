import { act, renderHook } from '@testing-library/react';
import {
  clearAllSurveyDrafts,
  sanitizeDraft,
  useSurveyDraft,
} from './use-survey-draft';

const KEY = 'umsspira:survey-draft:user-1';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('sanitizeDraft', () => {
  it('descarta salario y tiempo de inserción', () => {
    const result = sanitizeDraft({
      workCondition: 'works',
      cargo: 'Analista',
      salario: '5001-8000',
      insercionMeses: 6,
    });
    expect(result).toEqual({
      workCondition: 'works',
      cargo: 'Analista',
      empresa: undefined,
      area: undefined,
      modalidad: undefined,
    });
    expect(result).not.toHaveProperty('salario');
    expect(result).not.toHaveProperty('insercionMeses');
  });

  it('con "No trabaja" conserva solo la condición', () => {
    expect(sanitizeDraft({ workCondition: 'not-works', cargo: 'Analista' })).toEqual({
      workCondition: 'not-works',
    });
  });

  it('rechaza datos inválidos', () => {
    expect(sanitizeDraft({ workCondition: 'otra' })).toBeNull();
    expect(sanitizeDraft('texto')).toBeNull();
  });
});

describe('useSurveyDraft', () => {
  it('guarda y recupera el borrador del usuario', () => {
    const first = renderHook(() => useSurveyDraft('user-1'));
    act(() => first.result.current.saveDraft({ workCondition: 'works', cargo: 'Dev' }));
    expect(first.result.current.status).toBe('saved');

    const second = renderHook(() => useSurveyDraft('user-1'));
    expect(second.result.current.draft?.cargo).toBe('Dev');
    expect(second.result.current.status).toBe('recovered');
  });

  it('no mezcla borradores entre usuarios', () => {
    const a = renderHook(() => useSurveyDraft('user-1'));
    act(() => a.result.current.saveDraft({ workCondition: 'works' }));

    const b = renderHook(() => useSurveyDraft('user-2'));
    expect(b.result.current.draft).toBeNull();
  });

  it('clearDraft elimina el borrador', () => {
    const { result } = renderHook(() => useSurveyDraft('user-1'));
    act(() => result.current.saveDraft({ workCondition: 'works' }));
    act(() => result.current.clearDraft());
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('guarda salario y tiempo en sessionStorage y los recupera en la misma pestaña', () => {
    const first = renderHook(() => useSurveyDraft('user-1'));
    act(() => first.result.current.saveDraft({
      workCondition: 'works', cargo: 'Dev', salario_mensual: '5.001–8.000', tiempo_insercion: '6',
    }));
    expect(window.localStorage.getItem(KEY)).not.toContain('5.001');
    const second = renderHook(() => useSurveyDraft('user-1'));
    expect(second.result.current.draft).toEqual({
      workCondition: 'works', cargo: 'Dev', salario_mensual: '5.001–8.000', tiempo_insercion: '6',
    });
  });

  it('clearDraft también borra salario y tiempo de la sesión', () => {
    const { result } = renderHook(() => useSurveyDraft('user-1'));
    act(() => result.current.saveDraft({ workCondition: 'works', salario_mensual: '5.001–8.000' }));
    act(() => result.current.clearDraft());
    expect(window.sessionStorage.getItem('umsspira:survey-session:user-1')).toBeNull();
  });

  it('clearAllSurveyDrafts borra todos los borradores', () => {
    window.sessionStorage.setItem('umsspira:survey-session:a', '{}');
    window.localStorage.setItem('umsspira:survey-draft:a', '{}');
    window.localStorage.setItem('umsspira:survey-draft:b', '{}');
    window.localStorage.setItem('otra-clave', 'x');
    clearAllSurveyDrafts();
    expect(window.localStorage.getItem('umsspira:survey-draft:a')).toBeNull();
    expect(window.localStorage.getItem('otra-clave')).toBe('x');
    expect(window.sessionStorage.getItem('umsspira:survey-session:a')).toBeNull();
  });
});