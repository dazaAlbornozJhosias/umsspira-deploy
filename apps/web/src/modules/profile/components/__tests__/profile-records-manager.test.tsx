import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ProfileRecordsManager } from '@/modules/profile/components/profile-records-manager';
import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';

function getDesktopRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

function setOnline(isOnline: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: isOnline });
}

describe('ProfileRecordsManager', () => {
  afterEach(() => setOnline(true));

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

  it('pide confirmación y elimina solo el registro seleccionado', async () => {
    render(<ProfileRecordsManager />);
    const [, secondRow] = getDesktopRows();
    fireEvent.click(within(secondRow).getByRole('button', { name: 'Eliminar registro' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Estás seguro de que deseas eliminar este registro?')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(getDesktopRows()).toHaveLength(PROFILE_RECORDS_MOCK.education.length - 1);
    expect(screen.queryByText('Universidad Católica Boliviana')).not.toBeInTheDocument();
    expect(screen.getAllByText('Universidad Mayor de San Simón').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('Registro eliminado');
  });

  it('muestra error de conexión con opción de reintentar sin borrar el registro', async () => {
    setOnline(false);
    render(<ProfileRecordsManager />);
    fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No se pudo eliminar el registro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(getDesktopRows()).toHaveLength(PROFILE_RECORDS_MOCK.education.length);
  });

  it('rechaza eliminar un registro de otro egresado (403) sin modificar la lista', async () => {
    const records = {
      ...PROFILE_RECORDS_MOCK,
      education: [{ ...PROFILE_RECORDS_MOCK.education[0], ownerId: 'graduate-otro' }],
    };
    render(<ProfileRecordsManager initialRecords={records} />);
    fireEvent.click(within(getDesktopRows()[0]).getByRole('button', { name: 'Eliminar registro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No tienes permiso para eliminar este registro')).toBeInTheDocument();
    expect(getDesktopRows()).toHaveLength(1);
  });
});
