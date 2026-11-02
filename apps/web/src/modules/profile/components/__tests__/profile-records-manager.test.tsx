import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ProfileRecordsManager } from '@/modules/profile/components/profile-records-manager';
import { clearPendingProfileChanges, hasPendingProfileChanges } from '@/shared/hooks/use-recalculate-state';
import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import { clearAccessToken, setAccessToken } from '@/shared/services/auth-session';

// jsdom no trae fetch: se simula la respuesta del DELETE real
const fetchMock = jest.fn();

function responder(status: number, cuerpo: unknown = null) {
  fetchMock.mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
}

function getDesktopRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

describe('ProfileRecordsManager', () => {
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

  it('muestra iconos de editar y eliminar en cada registro', () => {
    render(<ProfileRecordsManager />);
    const rows = getDesktopRows();
    rows.forEach((row) => {
      // Editar ahora es un enlace a la pantalla de edición de la sección
      expect(within(row).getByRole('link', { name: 'Editar registro' })).toHaveAttribute('href', expect.stringMatching(/^\/profile\/education\/.+\/edit$/));
      expect(within(row).getByRole('button', { name: 'Eliminar registro' })).toBeInTheDocument();
    });
  });

  it('abre la pestaña indicada al volver de editar (BUG-HU04-003)', () => {
    render(<ProfileRecordsManager initialSection="experience" />);

    expect(within(getDesktopRows()[0]).getByText('NTT DATA')).toBeInTheDocument();
    expect(getDesktopRows()).toHaveLength(PROFILE_RECORDS_MOCK.experience.length);
  });

  it('pide confirmación, llama al DELETE real y quita solo ese registro sin recargar', async () => {
    responder(204);
    render(<ProfileRecordsManager />);
    const [, secondRow] = getDesktopRows();
    fireEvent.click(within(secondRow).getByRole('button', { name: 'Eliminar registro' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Estás seguro de que deseas eliminar este registro?')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`/api/v1/perfil/formacion-academica/${PROFILE_RECORDS_MOCK.education[1].id}$`));
    expect(opciones.method).toBe('DELETE');
    expect(getDesktopRows()).toHaveLength(PROFILE_RECORDS_MOCK.education.length - 1);
    expect(screen.queryByText('Universidad Católica Boliviana')).not.toBeInTheDocument();
    expect(screen.getAllByText('Universidad Mayor de San Simón').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('Registro eliminado');
  });

  it('muestra error de conexión con opción de reintentar sin borrar el registro', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<ProfileRecordsManager />);
    fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No se pudo eliminar el registro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(getDesktopRows()).toHaveLength(PROFILE_RECORDS_MOCK.education.length);
  });

  it('rechaza eliminar un registro de otro egresado (403) sin modificar la lista', async () => {
    responder(403, { error: { message: 'No tienes permiso' } });
    const records = { ...PROFILE_RECORDS_MOCK, education: [PROFILE_RECORDS_MOCK.education[0]] };
    render(<ProfileRecordsManager initialRecords={records} />);
    fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No tienes permiso para eliminar este registro')).toBeInTheDocument();
    expect(getDesktopRows()).toHaveLength(1);
  });

  describe('lista conectada a GET /api/v1/perfil (T9.1)', () => {
    const registro = { idTitulado: 'titulado-1', fechaCreacion: null };
    const perfil = {
      formacionAcademica: {
        registros: [
          { ...registro, id: 'f-1', institucion: 'Universidad Privada del Valle', titulo: 'Diplomado en Datos', grado: 'Diplomado', anioEgreso: 2024 },
        ],
      },
      experienciaLaboral: {
        registros: [{ ...registro, id: 'e-1', empresa: 'Jalasoft', cargo: 'Desarrollador', fechaInicio: '2023-02-01', fechaFin: null }],
      },
      certificaciones: { registros: [] },
    };

    function renderConectado() {
      return render(
        <ProfileStoreProvider>
          <ProfileRecordsManager />
        </ProfileStoreProvider>,
      );
    }

    it('muestra "Cargando tus registros…" sin datos de prueba mientras llega el perfil', () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      renderConectado();

      expect(screen.getByRole('status')).toHaveTextContent('Cargando tus registros…');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryAllByText('Universidad Mayor de San Simón')).toHaveLength(0);
    });

    it('si falla la carga muestra el error y "Reintentar" vuelve a pedir el perfil', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      renderConectado();

      const alerta = await screen.findByRole('alert');
      expect(alerta).toHaveTextContent('No se pudieron cargar tus registros');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: perfil }) });
      fireEvent.click(within(alerta).getByRole('button', { name: 'Reintentar' }));

      expect((await screen.findAllByText('Universidad Privada del Valle')).length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('muestra en cada pestaña los registros guardados en la base', async () => {
      responder(200, { data: perfil });
      renderConectado();

      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(getDesktopRows()).toHaveLength(1);
      expect(within(getDesktopRows()[0]).getByText('Universidad Privada del Valle')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: 'Experiencia' }));
      expect(getDesktopRows()).toHaveLength(1);
      expect(within(getDesktopRows()[0]).getByText('Jalasoft')).toBeInTheDocument();
    });

    it('muestra el estado vacío en cada pestaña sin registros', async () => {
      responder(200, {
        data: { formacionAcademica: { registros: [] }, experienciaLaboral: { registros: [] }, certificaciones: { registros: [] } },
      });
      renderConectado();

      expect(await screen.findByText('Aún no tienes registros guardados en esta sección.')).toBeInTheDocument();
      for (const pestana of ['Certificaciones', 'Experiencia']) {
        fireEvent.click(screen.getByRole('tab', { name: pestana }));
        expect(screen.getByText('Aún no tienes registros guardados en esta sección.')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      }
    });
  });

  describe('aviso de resultado al eliminar (T9.6)', () => {
    it.each([
      ['education', 'Formación académica', PROFILE_RECORDS_MOCK.education[0].id, 'formacion-academica'],
      ['experience', 'Experiencia', PROFILE_RECORDS_MOCK.experience[0].id, 'experiencia-laboral'],
      ['certification', 'Certificaciones', PROFILE_RECORDS_MOCK.certification[0].id, 'certificaciones'],
    ])('en %s muestra "Registro eliminado" y solo llama a nuestro endpoint', async (_section, pestana, id, ruta) => {
      responder(204);
      render(<ProfileRecordsManager />);
      fireEvent.click(screen.getByRole('tab', { name: pestana }));
      const total = getDesktopRows().length;
      fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Registro eliminado');
      expect(getDesktopRows()).toHaveLength(total - 1);
      // CA-06: se borra con el endpoint del perfil, sin llamar al motor de afinidad
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`/api/v1/perfil/${ruta}/${id}$`));
    });

    it('no muestra el aviso si la eliminación falla', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<ProfileRecordsManager />);
      fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

      expect(await screen.findByText('No se pudo eliminar el registro')).toBeInTheDocument();
      expect(screen.queryByText('Registro eliminado')).not.toBeInTheDocument();
    });

    it('BUG-HU8-02: registra cambios pendientes para el radar al eliminar un registro de educación o experiencia', async () => {
      clearPendingProfileChanges();
      responder(204);
      render(<ProfileRecordsManager />);

      expect(hasPendingProfileChanges()).toBe(false);

      fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Registro eliminado');
      expect(hasPendingProfileChanges()).toBe(true);
      clearPendingProfileChanges();
    });
  });
});
