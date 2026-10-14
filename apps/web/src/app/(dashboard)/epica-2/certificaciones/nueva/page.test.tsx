import { redirect } from 'next/navigation';

import NuevaCertificacionPage from './page';

jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('/epica-2/certificaciones/nueva', () => {
  it('redirige al formulario de completar perfil para que la Épica 3 no caiga en un 404', () => {
    NuevaCertificacionPage();

    expect(redirect).toHaveBeenCalledWith('/profile/completar');
  });
});
