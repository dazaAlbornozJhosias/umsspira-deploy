
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import ProfileSummary from '@/modules/profile/ver/profile-summary';

describe('ProfileSummary - T7.5 responsive', () => {
  it('muestra las secciones del resumen con datos de prueba', () => {
    render(
      <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
        <ProfileSummary />
      </ProfileStoreProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /Carlos Mendoza/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Mi afinidad' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Resumen del Perfil' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /descripción profesional/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /FORMACIÓN ACADÉMICA/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /EXPERIENCIA/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /CERTIFICACIONES/i }),
    ).toBeInTheDocument();
  });

  it('mantiene el contenedor principal preparado para el ancho disponible', () => {
    const { container } = render(
      <ProfileStoreProvider initialRecords={PROFILE_RECORDS_MOCK}>
        <ProfileSummary />
      </ProfileStoreProvider>,
    );

    expect(
      container.querySelector('.min-w-0.flex-1'),
    ).toBeInTheDocument();

    expect(
      container.querySelector('.w-full.shrink-0'),
    ).toBeInTheDocument();
  });
});
