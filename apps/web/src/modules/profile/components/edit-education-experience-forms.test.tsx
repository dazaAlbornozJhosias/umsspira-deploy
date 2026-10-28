import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { ProfileStoreProvider, useProfileStore } from '@/modules/profile/state/profile-store';
import type { EducationRecord, ExperienceRecord } from '@/modules/profile/types/profile-record';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

import { EditEducationForm } from './edit-education-form';
import { EditExperienceForm } from './edit-experience-form';

const push = jest.fn();
let routeId = '';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: routeId }),
  useRouter: () => ({ push }),
}));

function StoredValues() {
  const { records } = useProfileStore();
  const education = (records.education as EducationRecord[]).find((record) => record.id === routeId);
  const experience = (records.experience as ExperienceRecord[]).find((record) => record.id === routeId);
  return (
    <p data-testid="guardado">
      {education ? `${education.institution}|${education.graduationYear}` : ''}
      {experience ? `${experience.company}|${experience.endDate || 'actual'}` : ''}
    </p>
  );
}

// jsdom no trae fetch: se simula con la forma mínima que usa apiFetch
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown) {
  // La API responde { data } cuando todo sale bien y el error tal cual cuando falla
  const ok = status >= 200 && status < 300;
  fetchMock.mockResolvedValue({ ok, status, json: async () => (ok ? { data: cuerpo } : cuerpo) });
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  setAccessToken('test-token');
});

afterEach(() => {
  // @ts-expect-error se vuelve al entorno de jsdom, que no tiene fetch
  delete global.fetch;
  clearAccessToken();
});

// Con initialRecords el estado no consulta GET /api/v1/perfil: fetch queda solo para el PUT
function renderWith(form: React.ReactNode) {
  render(
    <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
      {form}
      <StoredValues />
    </ProfileStoreProvider>,
  );
}

describe('EditEducationForm', () => {
  beforeEach(() => {
    routeId = 'edu-1';
    push.mockClear();
  });

  it('limita institución y título a 150 caracteres (HU5-01)', () => {
    renderWith(<EditEducationForm />);

    expect(screen.getByLabelText('Institución')).toHaveAttribute('maxLength', '150');
    expect(screen.getByLabelText('Título')).toHaveAttribute('maxLength', '150');
  });

  it('carga la formación elegida y guarda los cambios con PUT en la API y en el estado compartido', async () => {
    responder(200, {
      id: 'edu-1',
      idTitulado: 'titulado-1',
      fechaCreacion: null,
      institucion: 'UMSS',
      titulo: 'Licenciatura en Ingeniería de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2019,
    });
    renderWith(<EditEducationForm />);
    expect(screen.getByLabelText('Institución')).toHaveValue('Universidad Mayor de San Simón');
    expect(screen.getByLabelText('Año de egreso')).toHaveValue('2018');

    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: 'UMSS' } });
    fireEvent.change(screen.getByLabelText('Año de egreso'), { target: { value: '20a19' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    expect(screen.getByTestId('guardado')).toHaveTextContent('UMSS|2019');
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/formacion-academica\/edu-1$/);
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(opciones.body)).toEqual({
      institucion: 'UMSS',
      titulo: 'Licenciatura en Ingeniería de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2019,
    });
  });

  it('409: muestra el mensaje del backend y no guarda', async () => {
    const mensaje = 'La formación académica ya se encuentra registrada.';
    responder(409, { statusCode: 409, message: mensaje, error: mensaje });
    renderWith(<EditEducationForm />);

    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: 'UMSS' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(mensaje)).toHaveAttribute('id', 'error-education-save');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('guardado')).toHaveTextContent('Universidad Mayor de San Simón|2018');
    expect(screen.getByLabelText('Institución')).toHaveValue('UMSS');
  });

  it('400: muestra el mensaje del backend y no guarda', async () => {
    const mensaje = 'El título no puede superar los 150 caracteres';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });
    renderWith(<EditEducationForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('no llama a la API si queda igual a otra formación registrada', () => {
    renderWith(<EditEducationForm />);

    // edu-2 del mock: Universidad Católica Boliviana · Maestría en Gestión de TI · 2021
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: ' universidad católica boliviana ' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'MAESTRÍA EN GESTIÓN DE TI' } });
    fireEvent.change(screen.getByLabelText('Año de egreso'), { target: { value: '2021' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('La formación académica ya se encuentra registrada')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('el propio registro sin cambios no cuenta como duplicado', async () => {
    responder(200, {
      id: 'edu-1',
      idTitulado: 'titulado-1',
      fechaCreacion: null,
      institucion: 'Universidad Mayor de San Simón',
      titulo: 'Licenciatura en Ingeniería de Sistemas',
      grado: 'Licenciatura',
      anioEgreso: 2018,
    });
    renderWith(<EditEducationForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    expect(screen.queryByText('La formación académica ya se encuentra registrada')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no llama a la API con un año de egreso posterior al actual y quita el error al corregirlo', () => {
    renderWith(<EditEducationForm />);
    const anio = screen.getByLabelText('Año de egreso');

    fireEvent.change(anio, { target: { value: String(new Date().getFullYear() + 1) } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('El año de egreso no puede ser posterior al año actual')).toHaveAttribute('id', 'error-graduationYear');
    expect(anio).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(anio, { target: { value: '2018' } });
    expect(screen.queryByText('El año de egreso no puede ser posterior al año actual')).not.toBeInTheDocument();
  });

  it('avisa si la formación no existe', () => {
    routeId = 'no-existe';
    renderWith(<EditEducationForm />);
    expect(screen.getByText('No encontramos esta formación académica')).toBeInTheDocument();
  });
});

describe('EditExperienceForm · fecha mínima (BUG-HU2-008)', () => {
  it('no acepta fechas anteriores a 1950 en fecha inicio ni fecha fin', () => {
    routeId = 'exp-2';
    renderWith(<EditExperienceForm />);

    expect(screen.getByLabelText('Fecha inicio')).toHaveAttribute('min', '1950-01-01');
    expect(screen.getByLabelText('Fecha fin')).toHaveAttribute('min', '1950-01-01');
  });
});

describe('EditExperienceForm', () => {
  beforeEach(() => {
    routeId = 'exp-2';
    push.mockClear();
  });

  it('carga la experiencia elegida con sus fechas', () => {
    renderWith(<EditExperienceForm />);
    expect(screen.getByLabelText('Empresa')).toHaveValue('Jalasoft');
    expect(screen.getByLabelText('Fecha inicio')).toHaveValue('2021-01-04');
    expect(screen.getByLabelText('Fecha fin')).toHaveValue('2023-06-30');
    expect(screen.getByLabelText('Actualmente trabajo aquí')).not.toBeChecked();
  });

  const exp2 = {
    id: 'exp-2',
    idTitulado: 'titulado-1',
    fechaCreacion: null,
    empresa: 'Jalasoft',
    cargo: 'Desarrollador Senior',
    fechaInicio: '2021-01-04',
    fechaFin: '2023-06-30',
  };

  it('guarda los cambios con PUT en la API y en el estado compartido', async () => {
    responder(200, { ...exp2, empresa: 'Jala' });
    renderWith(<EditExperienceForm />);

    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: ' Jala ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    expect(screen.getByTestId('guardado')).toHaveTextContent('Jala|2023-06-30');
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/perfil\/experiencia-laboral\/exp-2$/);
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(opciones.body)).toEqual({
      empresa: 'Jala',
      cargo: 'Desarrollador Senior',
      fechaInicio: '2021-01-04',
      fechaFin: '2023-06-30',
    });
  });

  it('al marcar "Actualmente trabajo aquí" deshabilita la fecha fin y guarda como trabajo actual sin enviar fechaFin', async () => {
    responder(200, { ...exp2, fechaFin: null });
    renderWith(<EditExperienceForm />);
    fireEvent.click(screen.getByLabelText('Actualmente trabajo aquí'));
    expect(screen.getByLabelText('Fecha fin')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    expect(screen.getByTestId('guardado')).toHaveTextContent('Jalasoft|actual');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('fechaFin');
  });

  it('400: muestra el mensaje del backend y no guarda', async () => {
    const mensaje = 'La fecha de fin no puede ser posterior a hoy';
    responder(400, { statusCode: 400, message: [mensaje], error: mensaje });
    renderWith(<EditExperienceForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(mensaje)).toHaveAttribute('id', 'error-experience-save');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('guardado')).toHaveTextContent('Jalasoft|2023-06-30');
  });

  it('no llama a la API si la fecha fin es anterior a la fecha inicio y quita el error al corregirla', () => {
    renderWith(<EditExperienceForm />);
    const fin = screen.getByLabelText('Fecha fin');

    fireEvent.change(fin, { target: { value: '2020-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('La fecha fin no puede ser anterior a la fecha inicio')).toHaveAttribute('id', 'error-endDate');
    expect(fin).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(fin, { target: { value: '2023-06-30' } });
    expect(screen.queryByText('La fecha fin no puede ser anterior a la fecha inicio')).not.toBeInTheDocument();
  });

  it('Cancelar vuelve a Gestionar registros', () => {
    renderWith(<EditExperienceForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(push).toHaveBeenCalledWith('/profile/records?seccion=experience');
  });
});

describe('aviso de resultado al editar (T9.6)', () => {
  const registro = { idTitulado: 'titulado-1', fechaCreacion: null };

  it.each([
    [
      'formación académica',
      'edu-1',
      <EditEducationForm key="education" />,
      { ...registro, id: 'edu-1', institucion: 'UMSS', titulo: 'Licenciatura en Ingeniería de Sistemas', grado: 'Licenciatura', anioEgreso: 2018 },
      'formacion-academica',
    ],
    [
      'experiencia laboral',
      'exp-2',
      <EditExperienceForm key="experience" />,
      { ...registro, id: 'exp-2', empresa: 'Jalasoft', cargo: 'Desarrollador', fechaInicio: '2021-01-01', fechaFin: '2023-06-30' },
      'experiencia-laboral',
    ],
  ])('en %s muestra "Registro actualizado" y solo llama a nuestro endpoint', async (_seccion, id, form, respuesta, ruta) => {
    routeId = id;
    responder(200, respuesta);
    renderWith(form);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Registro actualizado');
    // CA-06: se guarda con el endpoint del perfil, sin llamar al motor de afinidad
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`/api/v1/perfil/${ruta}/${id}$`));
  });
});
