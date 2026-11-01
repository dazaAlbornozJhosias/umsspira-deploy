import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ProfileRecordsManager } from '@/modules/profile/components/profile-records-manager';
import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import ProfileSummary from '@/modules/profile/ver/profile-summary';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

import { ProfileStoreProvider, useProfileStore } from './profile-store';

function AddEducationButton() {
  const { addEducation } = useProfileStore();
  return (
    <button
      type="button"
      onClick={() =>
        addEducation({ institution: 'Universidad Privada del Valle', title: 'Diplomado en Datos', graduationYear: '2024', degree: 'Diplomado' })
      }
    >
      agregar
    </button>
  );
}

describe('ProfileStoreProvider', () => {
  it('lo agregado en el estado compartido aparece en el resumen del perfil', () => {
    render(
      <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
        <AddEducationButton />
        <ProfileSummary />
      </ProfileStoreProvider>,
    );

    expect(screen.queryByText('Universidad Privada del Valle')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'agregar' }));
    expect(screen.getByText('Universidad Privada del Valle')).toBeInTheDocument();
  });

  it('"Mis registros" y el resumen muestran los mismos datos de prueba', () => {
    render(
      <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
        <ProfileRecordsManager />
      </ProfileStoreProvider>,
    );

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(PROFILE_RECORDS_MOCK.education.length);
    expect(within(rows[0]).getByText('Universidad Mayor de San Simón')).toBeInTheDocument();
  });
});

describe('ProfileStoreProvider · carga desde la API', () => {
  const fetchMock = jest.fn();

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

  const registro = { idTitulado: 'titulado-1', fechaCreacion: null };
  const perfil = {
    formacionAcademica: {
      registros: [{ ...registro, id: 'f-1', institucion: 'Universidad Privada del Valle', titulo: 'Diplomado en Datos', grado: 'Licenciatura', anioEgreso: 2024 }],
    },
    experienciaLaboral: { registros: [] },
    certificaciones: { registros: [] },
  };

  it('reemplaza los datos de prueba por los registros de GET /api/v1/perfil', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: perfil }) });

    render(
      <ProfileStoreProvider>
        <ProfileRecordsManager />
      </ProfileStoreProvider>,
    );

    expect((await screen.findAllByText('Universidad Privada del Valle')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Universidad Mayor de San Simón')).toHaveLength(0);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/perfil$/);
  });

  it('si la API no responde, "Mis registros" muestra el error en vez de los datos de prueba (T9.1)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    render(
      <ProfileStoreProvider>
        <ProfileRecordsManager />
      </ProfileStoreProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus registros');
    expect(screen.queryAllByText('Universidad Mayor de San Simón')).toHaveLength(0);
  });

  it('muestra en el resumen la descripción y "Sin registros" en las secciones vacías', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { ...perfil, descripcionProfesional: 'Ingeniero de sistemas.' } }),
    });

    render(
      <ProfileStoreProvider>
        <ProfileSummary />
      </ProfileStoreProvider>,
    );

    expect(await screen.findByText('Ingeniero de sistemas.')).toBeInTheDocument();
    // Experiencia y certificaciones llegan vacías desde la API
    expect(screen.getAllByText('Sin registros')).toHaveLength(2);
  });

  it('no consulta la API si recibe registros iniciales', () => {
    render(
      <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
        <ProfileRecordsManager />
      </ProfileStoreProvider>,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
