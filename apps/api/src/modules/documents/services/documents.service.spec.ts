import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { redisClient } from '../../../shared/lib/redis';
import { DocumentsRepository } from '../repositories/documents.repository';
import { DOCUMENT_MESSAGES } from '../contracts/document.constants';
import { UploadDocumentDto } from '../contracts/dto';
import { UploadedDocumentFile } from '../contracts/uploaded-document-file';
import { DocumentsService } from './documents.service';
import { FileValidatorService } from './file-validator.service';

jest.mock('../../../shared/lib/redis', () => ({
  redisClient: { get: jest.fn() },
}));

const mockedRedis = redisClient as unknown as { get: jest.Mock };

const SESSION_TOKEN = '22222222-2222-4222-8222-222222222222';

const dto: UploadDocumentDto = {
  sessionToken: SESSION_TOKEN,
  tipoDocumento: 'titulo_provision_nacional',
};

const pdfFile: UploadedDocumentFile = {
  originalname: 'Título Juan.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('%PDF-1.7\ncontenido', 'latin1'),
  size: 2048,
};

describe('DocumentsService', () => {
  let repository: { upload: jest.Mock };
  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = { upload: jest.fn().mockImplementation(async (path: string) => path) };
    service = new DocumentsService(
      repository as unknown as DocumentsRepository,
      new FileValidatorService(),
    );
    mockedRedis.get.mockResolvedValue(JSON.stringify({ correo: 'juan@example.com', isEmailVerified: true }));
  });

  it('sube el documento al bucket privado con un nombre generado por el servidor (CA-03.2)', async () => {
    const result = await service.uploadDocument(dto, pdfFile);

    expect(mockedRedis.get).toHaveBeenCalledWith(`registration-session:${SESSION_TOKEN}`);
    const [path, content, contentType] = repository.upload.mock.calls[0];
    expect(path).toMatch(new RegExp(`^solicitudes/${SESSION_TOKEN}/[0-9a-f-]{36}\\.pdf$`));
    expect(path).not.toContain('Juan');
    expect(content).toBe(pdfFile.buffer);
    expect(contentType).toBe('application/pdf');
    expect(result).toEqual({
      path,
      tipoDocumento: 'titulo_provision_nacional',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      originalName: 'Título Juan.pdf',
    });
  });

  it('bloquea la carga si el correo no fue verificado (CA-03.1)', async () => {
    mockedRedis.get.mockResolvedValue(JSON.stringify({ isEmailVerified: false }));

    const promise = service.uploadDocument(dto, pdfFile);

    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);
    await expect(promise).rejects.toThrow(DOCUMENT_MESSAGES.emailNotVerified);
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it('responde 410 cuando la sesion de registro ya vencio', async () => {
    mockedRedis.get.mockResolvedValue(null);

    await expect(service.uploadDocument(dto, pdfFile)).rejects.toBeInstanceOf(GoneException);
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it('pide adjuntar el documento cuando no llega ningun archivo (CA-03.5)', async () => {
    const promise = service.uploadDocument(dto, undefined);

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toThrow(DOCUMENT_MESSAGES.missingFile);
  });

  it('rechaza un archivo cuyo contenido real no es permitido sin subirlo (CA-03.3)', async () => {
    const fakePdf = { ...pdfFile, buffer: Buffer.from('no es un pdf', 'latin1') };

    await expect(service.uploadDocument(dto, fakePdf)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.upload).not.toHaveBeenCalled();
  });

  it('responde 503 si Supabase Storage falla', async () => {
    repository.upload.mockRejectedValue(new Error('Bucket not found'));

    const promise = service.uploadDocument(dto, pdfFile);

    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.toThrow(DOCUMENT_MESSAGES.storageUnavailable);
  });

  it('responde 503 si Redis no esta disponible', async () => {
    mockedRedis.get.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.uploadDocument(dto, pdfFile)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
