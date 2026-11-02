import { apiFetch, ApiError } from '@/shared/services/api-client';
import {
  buildSurveySubmissionBody,
  submitSurvey,
  SURVEY_SUBMISSION_PATH,
  SURVEY_SENT_MESSAGE,
  SURVEY_SEND_ERROR_MESSAGE,
} from './surveys.service';

jest.mock('@/shared/services/api-client', () => ({
  ...jest.requireActual('@/shared/services/api-client'),
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;
const laboral = {
  condicion_laboral: true,
  cargo: 'Analista',
  empresa: 'Empresa',
  area: 'Sistemas',
  modalidad: 'Remoto',
  salario_mensual: 'Bs 3.000 a Bs 5.000',
  tiempo_insercion: 'De 3 a 6 meses',
};

beforeEach(() => mockedApiFetch.mockReset());

describe('HU-EP09-03 / T3.4 — servicio de envío', () => {
  it('usa POST del cliente HTTP autenticado existente', async () => {
    mockedApiFetch.mockResolvedValueOnce({ data: { id: 'nueva' } });
    await submitSurvey(laboral);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      SURVEY_SUBMISSION_PATH,
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify(laboral),
      }),
    );
  });

  it.each([200, 201])('trata HTTP %i como éxito', async (_status) => {
    // apiFetch retorna datos solo para respuestas 2xx.
    mockedApiFetch.mockResolvedValueOnce({});
    await expect(submitSurvey(laboral)).resolves.toBeUndefined();
  });

  it('trata HTTP 409 Conflict como éxito (CA-04)', async () => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError(409, 'Ya respondida'));
    await expect(submitSurvey(laboral)).resolves.toBeUndefined();
  });

  it.each([400, 401, 403, 422, 500, 503])(
    'propaga el error HTTP %i para que se muestre el mensaje CA-05',
    async (code) => {
      mockedApiFetch.mockRejectedValueOnce(new ApiError(code, 'Error'));
      await expect(submitSurvey(laboral)).rejects.toMatchObject({ status: code });
    },
  );

  it('propaga un fallo de conexión al hook sin modificar respuestas', async () => {
    const source = { ...laboral };
    mockedApiFetch.mockRejectedValueOnce(new ApiError(0, 'Red caída'));
    await expect(submitSurvey(source)).rejects.toMatchObject({ status: 0 });
    expect(source).toEqual(laboral);
  });

  it('descarta los seis campos laborales al enviar No trabaja (CA-02/CA-03)', async () => {
    mockedApiFetch.mockResolvedValueOnce({});
    await submitSurvey({ ...laboral, condicion_laboral: false });
    expect(JSON.parse(mockedApiFetch.mock.calls[0][1].body)).toEqual({
      condicion_laboral: false,
    });
  });

  it('conserva id_encuesta si se proporciona, incluso al responder No trabaja', () => {
    expect(buildSurveySubmissionBody({
      ...laboral,
      id_encuesta: 'encuesta-id',
      condicion_laboral: false,
    })).toEqual({
      condicion_laboral: false,
      id_encuesta: 'encuesta-id',
    });
  });

  it('elimina propiedades ajenas al contrato de envío', () => {
    expect(buildSurveySubmissionBody({
      ...laboral,
      informacion_oculta: 'no enviar',
    } as typeof laboral)).toEqual(laboral);
  });

  it('no permite enviar una condición laboral no seleccionada', async () => {
    await expect(submitSurvey({ condicion_laboral: null } as unknown as typeof laboral))
      .rejects.toThrow('Debe seleccionar su condición laboral');
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('expone los mensajes EXACTOS de CA-04 y CA-05', () => {
    expect(SURVEY_SENT_MESSAGE).toBe('Encuesta enviada correctamente');
    expect(SURVEY_SEND_ERROR_MESSAGE).toBe('No se pudo enviar la encuesta. Intente nuevamente');
  });
});
