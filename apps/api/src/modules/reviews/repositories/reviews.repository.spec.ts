import { getSupabaseClient } from '../../../shared/lib/supabase';
import { ReviewsRepository } from './reviews.repository';

jest.mock('../../../shared/lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockedGetClient = getSupabaseClient as jest.Mock;

function singleRow(row: unknown) {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
      }),
    }),
  };
}

describe('ReviewsRepository (dictamen en Supabase)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lee el estado real y normaliza el español de la BD (CA-04.4)', async () => {
    mockedGetClient.mockReturnValue({ from: jest.fn().mockReturnValue(singleRow({ id: 's-1', estado: 'Pendiente' })) });
    const repository = new ReviewsRepository();

    await expect(repository.getApplicationStatus('s-1')).resolves.toBe('PENDING');
  });

  it('devuelve null cuando la solicitud no existe', async () => {
    mockedGetClient.mockReturnValue({ from: jest.fn().mockReturnValue(singleRow(null)) });
    const repository = new ReviewsRepository();

    await expect(repository.getApplicationStatus('inexistente')).resolves.toBeNull();
  });

  it('guarda el dictamen y actualiza la solicitud para que la bandeja lo muestre', async () => {
    mockedGetClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'dictamen') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'dictamen-1' }, error: null }),
              }),
            }),
          };
        }
        return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) };
      }),
    });
    const repository = new ReviewsRepository();

    const review = await repository.saveReview({
      applicationId: 's-1',
      decision: 'APPROVED',
      status: 'APPROVED',
      category: null,
      note: null,
      reviewedBy: 'admin-1',
    });

    expect(review.id).toBe('dictamen-1');
    expect(review.status).toBe('APPROVED');
  });

  it('une categoría y nota en la justificación al observar (CA-04.5)', async () => {
    const inserted: Record<string, unknown>[] = [];
    mockedGetClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'dictamen') {
          return {
            insert: jest.fn((row: Record<string, unknown>) => {
              inserted.push(row);
              return {
                select: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'dictamen-2' }, error: null }),
                }),
              };
            }),
          };
        }
        return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) };
      }),
    });
    const repository = new ReviewsRepository();

    await repository.saveReview({
      applicationId: 's-1',
      decision: 'OBSERVED',
      status: 'OBSERVED',
      category: 'Documento ilegible',
      note: 'La imagen no se lee con claridad.',
      reviewedBy: 'admin-1',
    });

    expect(inserted[0]).toMatchObject({
      id_solicitud: 's-1',
      justificacion: 'Documento ilegible\n\nLa imagen no se lee con claridad.',
    });
  });

  it('lee el contacto real del titulado desde su solicitud', async () => {
    mockedGetClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'solicitud') return singleRow({ id_detalle_solicitud: 'detalle-1' });
        return singleRow({ nombre: 'Ana', apellido: 'Pérez', email: 'titulado@umss.edu.bo' });
      }),
    });
    const repository = new ReviewsRepository();

    await expect(repository.getApplicantContact('s-1')).resolves.toEqual({
      email: 'titulado@umss.edu.bo',
      fullName: 'Ana Pérez',
    });
  });
});
