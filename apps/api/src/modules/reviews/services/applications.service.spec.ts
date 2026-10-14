import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository';
import { ApplicationsService } from './applications.service';

const item = {
  id: 'solicitud-1',
  code: 'EGR-2025-ABCDEF',
  fullName: 'Alejandro Rojas Torrico',
  email: 'alejandro.rojas@gmail.com',
  ci: '6849201',
  issuedIn: '',
  sisCode: '201804921',
  career: 'Ingeniería de Sistemas',
  careerId: 'carrera-1',
  status: 'PENDING' as const,
  submittedAt: new Date().toISOString(),
};

describe('ApplicationsService', () => {
  let repository: jest.Mocked<Pick<ApplicationsRepository, 'listApplications' | 'findApplicationById' | 'createDocumentSignedUrl'>>;
  let service: ApplicationsService;

  beforeEach(() => {
    repository = {
      listApplications: jest.fn(),
      findApplicationById: jest.fn(),
      createDocumentSignedUrl: jest.fn(),
    };
    service = new ApplicationsService(repository as unknown as ApplicationsRepository);
  });

  it('pagina con máximo 15 filas por defecto (CA-04.1)', async () => {
    repository.listApplications.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ ...item, id: `s-${i}` })));

    const page = await service.listApplications({ page: 1, pageSize: 99 });

    expect(page.total).toBe(20);
    expect(page.items).toHaveLength(15);
    expect(page.pageSize).toBe(15);
  });

  it('normaliza el estado en español antes de filtrar', async () => {
    repository.listApplications.mockResolvedValue([]);

    await service.listApplications({ page: 1, pageSize: 15, status: 'pendiente' });

    expect(repository.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('responde 404 cuando el expediente no existe (CA-04.3)', async () => {
    repository.findApplicationById.mockResolvedValue(null);

    await expect(service.getApplication('inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('responde 503 cuando la base de datos falla', async () => {
    repository.listApplications.mockRejectedValue(new Error('fetch failed'));

    await expect(service.listApplications({ page: 1, pageSize: 15 })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('entrega la URL firmada del documento', async () => {
    repository.createDocumentSignedUrl.mockResolvedValue({ url: 'https://firmada.local/d.pdf', expiresIn: 300 });

    await expect(service.getDocumentUrl('solicitudes/x/y.pdf')).resolves.toEqual({
      url: 'https://firmada.local/d.pdf',
      expiresIn: 300,
    });
  });
});
