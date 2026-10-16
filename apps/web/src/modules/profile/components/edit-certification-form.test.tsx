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
  });

  it('guarda los cambios en el estado compartido y muestra "Guardado"', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Nombre de la certificación'), { target: { value: 'AWS Solutions Architect Pro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    expect(screen.getByTestId('nombre-guardado')).toHaveTextContent('AWS Solutions Architect Pro');
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
