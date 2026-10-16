import { redirect } from 'next/navigation';

import NuevaCertificacionPage from './page';

jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('/epica-2/certificaciones/nueva', () => {
  beforeEach(() => (redirect as unknown as jest.Mock).mockClear());

  it('redirige al formulario de completar perfil para que la Épica 3 no caiga en un 404', () => {
    NuevaCertificacionPage({});

    expect(redirect).toHaveBeenCalledWith('/profile/completar');
  });

  it('conserva el regreso a afinidad (E2.3)', () => {
    NuevaCertificacionPage({ searchParams: { returnTo: '/afinidad' } });

    expect(redirect).toHaveBeenCalledWith('/profile/completar?returnTo=%2Fafinidad');
  });

  it('descarta destinos externos', () => {
    NuevaCertificacionPage({ searchParams: { returnTo: '//sitio-externo.com' } });

    expect(redirect).toHaveBeenCalledWith('/profile/completar');
  });
});
