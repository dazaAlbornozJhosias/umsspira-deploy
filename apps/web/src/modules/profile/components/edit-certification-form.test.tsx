import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProfileStoreProvider, useProfileStore } from '@/modules/profile/state/profile-store';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';

import { EditCertificationForm } from './edit-certification-form';

const push = jest.fn();
let routeId = 'cert-1';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: routeId }),
  useRouter: () => ({ push }),
}));

function CertificationName({ id }: { id: string }) {
  const { records } = useProfileStore();
  const certification = (records.certification as CertificationRecord[]).find((record) => record.id === id);
  return <p data-testid="nombre-guardado">{certification?.name}</p>;
}

function renderForm() {
  render(
    <ProfileStoreProvider>
      <EditCertificationForm />
      <CertificationName id={routeId} />
    </ProfileStoreProvider>,
  );
}

describe('EditCertificationForm', () => {
  beforeEach(() => {
    routeId = 'cert-1';
    push.mockClear();
  });

  it('carga los datos de la certificación elegida', () => {
    renderForm();
    expect(screen.getByLabelText('Nombre de la certificación')).toHaveValue('AWS Solutions Architect');
    expect(screen.getByLabelText('Entidad emisora')).toHaveValue('Amazon Web Services');
    expect(screen.getByLabelText('Año')).toHaveValue('2022');
    expect(screen.getByText('Respaldo verificado')).toBeInTheDocument();
    expect(screen.getByText('Solo JPG, máximo 5 MB')).toBeInTheDocument();
  });

  it('guarda los cambios en el estado compartido y muestra "Guardado"', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Nombre de la certificación'), { target: { value: 'AWS Solutions Architect Pro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    expect(screen.getByTestId('nombre-guardado')).toHaveTextContent('AWS Solutions Architect Pro');
  });

  it('rechaza un respaldo que no es JPG o supera 5 MB y no lo adjunta (BUG-HU2-004 en edición)', () => {
    renderForm();
    const input = screen.getByLabelText('Subir foto');
    const png = new File(['x'], 'certificado.png', { type: 'image/png' });
    const grande = new File(['x'], 'grande.jpg', { type: 'image/jpeg' });
    Object.defineProperty(grande, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [png] } });
    expect(screen.getByRole('alert')).toHaveTextContent('Formato no permitido. Solo JPG');
    expect(screen.queryByText('certificado.png')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { files: [grande] } });
    expect(screen.getByRole('alert')).toHaveTextContent('El archivo no puede superar 5 MB');
    expect(screen.queryByText('grande.jpg')).not.toBeInTheDocument();
  });

  it('adjunta un respaldo JPG válido', () => {
    renderForm();
    const jpg = new File(['x'], 'certificado.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Subir foto'), { target: { files: [jpg] } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('certificado.jpg')).toBeInTheDocument();
  });

  it('Cancelar vuelve a Gestionar registros', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(push).toHaveBeenCalledWith('/profile/records?seccion=certification');
  });

  it('avisa si la certificación no existe', () => {
    routeId = 'no-existe';
    renderForm();
    expect(screen.getByText('No encontramos esta certificación')).toBeInTheDocument();
  });
});
