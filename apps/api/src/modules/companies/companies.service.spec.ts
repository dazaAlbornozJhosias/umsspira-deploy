import { NotFoundException } from '@nestjs/common';
import { query } from '../../shared/lib/database';
import { CompaniesService } from './companies.service';

jest.mock('../../shared/lib/database', () => ({
  query: jest.fn(),
}));

const mockedQuery = query as jest.Mock;

describe('CompaniesService (perfil con JWT de Supabase)', () => {
  const service = new CompaniesService();
  const authUid = '99f6f1ae-5f82-4909-b3d5-cf598f2f0c24';

  beforeEach(() => jest.clearAllMocks());

  it('resuelve la empresa por id_usuario y devuelve su encabezado', async () => {
    mockedQuery
      .mockResolvedValueOnce([{ id: 'empresa-1' }])
      .mockResolvedValueOnce([{ nombre: 'Amazon.com, Inc.', eslogan: null, logoUrl: null, bannerUrl: null }]);

    const header = await service.getHeader(authUid);

    expect(mockedQuery).toHaveBeenNthCalledWith(
      1,
      'SELECT id FROM empresa WHERE id_usuario = $1 LIMIT 1',
      [authUid],
    );
    expect(header).toMatchObject({ nombre: 'Amazon.com, Inc.' });
  });

  it('responde 404 cuando el usuario no tiene empresa vinculada', async () => {
    mockedQuery.mockResolvedValueOnce([]);

    await expect(service.getHeader('uid-sin-empresa')).rejects.toBeInstanceOf(NotFoundException);
  });
});
