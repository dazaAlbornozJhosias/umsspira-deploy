import { act, renderHook } from '@testing-library/react';
import { useSurveySubmit } from './use-survey-submit';
import { ApiError } from '@/shared/services/api-client';
import { submitSurvey } from '../services/surveys.service';

jest.mock('../services/surveys.service', () => ({
  ...jest.requireActual('../services/surveys.service'),
  submitSurvey: jest.fn(),
}));

const mockSubmit = submitSurvey as jest.Mock;
const input = {
  condicion_laboral: true,
  cargo: 'Analista',
  empresa: 'Empresa',
  area: 'Sistemas',
  modalidad: 'Presencial',
};

beforeEach(() => mockSubmit.mockReset());

describe('HU-EP09-03 / T3.4 — hook de envío', () => {
  it('comienza sin mensajes ni cargas', () => {
    const { result } = renderHook(() => useSurveySubmit());
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.errorKind).toBeNull();
    expect(result.current.message).toBeNull();
  });

  it('presenta el mensaje de éxito para una respuesta aceptada', async () => {
    mockSubmit.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSurveySubmit());
    let sent = false;
    await act(async () => { sent = await result.current.submit(input); });
    expect(sent).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.status).toBe('success');
    expect(result.current.message).toBe('Encuesta enviada correctamente');
    expect(mockSubmit).toHaveBeenCalledWith(input);
  });

  it('expone isSubmitting mientras espera la respuesta', async () => {
    let finish!: () => void;
    mockSubmit.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useSurveySubmit());
    let pending!: Promise<boolean>;
    act(() => { pending = result.current.submit(input); });
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.message).toBeNull();
    await act(async () => { finish(); await pending; });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('impide dos envíos simultáneos, incluso antes del re-render', async () => {
    let finish!: () => void;
    mockSubmit.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useSurveySubmit());
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.submit(input);
      second = result.current.submit(input);
    });
    await expect(second).resolves.toBe(false);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); await first; });
  });

  it('muestra el texto EXACTO de error sin modificar los valores enviados', async () => {
    mockSubmit.mockRejectedValueOnce(new Error('Error servidor'));
    const source = { ...input };
    const { result } = renderHook(() => useSurveySubmit());
    let accepted = true;
    await act(async () => { accepted = await result.current.submit(source); });
    expect(accepted).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('No se pudo enviar la encuesta. Intente nuevamente');
    expect(source).toEqual(input);
  });

  it('permite reintentar después de un error conservando las respuestas', async () => {
    mockSubmit.mockRejectedValueOnce(new Error('Error 503'));
    mockSubmit.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSurveySubmit());
    await act(async () => { await result.current.submit(input); });
    expect(result.current.status).toBe('error');
    let accepted = false;
    await act(async () => { accepted = await result.current.submit(input); });
    expect(accepted).toBe(true);
    expect(result.current.status).toBe('success');
    expect(mockSubmit).toHaveBeenCalledTimes(2);
    expect(mockSubmit).toHaveBeenNthCalledWith(2, input);
  });

  it('diferencia una falla de conexión de un error HTTP', async () => {
    mockSubmit.mockRejectedValueOnce(new ApiError(0, 'Sin conexión'));
    const { result } = renderHook(() => useSurveySubmit());
    await act(async () => { await result.current.submit(input); });
    expect(result.current.errorKind).toBe('connection');
    expect(result.current.message).toBe('No se pudo enviar la encuesta. Intente nuevamente');
    mockSubmit.mockRejectedValueOnce(new ApiError(500, 'Servidor'));
    await act(async () => { await result.current.submit(input); });
    expect(result.current.errorKind).toBe('http');
  });

  it('resetea el mensaje al editar sin borrar el formulario', async () => {
    mockSubmit.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSurveySubmit());
    await act(async () => { await result.current.submit(input); });
    act(() => result.current.resetFeedback());
    expect(result.current.status).toBe('idle');
    expect(result.current.message).toBeNull();
    expect(input.empresa).toBe('Empresa');
  });
});
