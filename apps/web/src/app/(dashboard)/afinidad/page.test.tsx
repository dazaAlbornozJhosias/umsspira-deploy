import { redirect } from 'next/navigation';
import AfinidadPage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('/afinidad', () => {
  it('redirige a /afinidad/egresado por defecto', () => {
    AfinidadPage();

    expect(redirect).toHaveBeenCalledWith('/afinidad/egresado');
  });
});
