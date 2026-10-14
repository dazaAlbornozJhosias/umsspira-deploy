import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { redisClient } from '../../../shared/lib/redis';
import { DocumentsRepository } from '../repositories/documents.repository';
import { UploadDocumentDto } from '../contracts/dto';
import { UploadedDocumentFile } from '../contracts/uploaded-document-file';
import { UploadDocumentResponse } from '../contracts/upload-document.response';
import {
  DOCUMENT_FILE_FIELD,
  DOCUMENT_MESSAGES,
  registrationSessionKey,
} from '../contracts/document.constants';
import { FileValidatorService } from './file-validator.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly fileValidator: FileValidatorService,
  ) {}

  /**
   * Guarda el documento de respaldo en el bucket privado (CA-03.2).
   * Requiere una sesion de registro vigente con el correo verificado (CA-03.1)
   * y un archivo PDF, PNG o JPG real de hasta 5 MB (CA-03.3).
   * Devuelve la ruta del archivo para crear la solicitud con fun_registrar_solicitud.
   */
  async uploadDocument(
    dto: UploadDocumentDto,
    file: UploadedDocumentFile | undefined,
  ): Promise<UploadDocumentResponse> {
    await this.assertVerifiedSession(dto.sessionToken);

    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        message: DOCUMENT_MESSAGES.missingFile,
        errors: [{ field: DOCUMENT_FILE_FIELD, message: DOCUMENT_MESSAGES.missingFile }],
      });
    }

    const detected = this.fileValidator.validate(file);
    // El nombre del archivo lo genera el servidor; el nombre original nunca forma parte de la ruta.
    const path = `solicitudes/${dto.sessionToken}/${randomUUID()}.${detected.extension}`;

    let storedPath: string;
    try {
      storedPath = await this.documentsRepository.upload(path, file.buffer, detected.mimeType);
    } catch (error) {
      this.logger.error(`No se pudo subir el documento a Storage: ${(error as Error).message}`);
      throw new ServiceUnavailableException(DOCUMENT_MESSAGES.storageUnavailable);
    }

    return {
      path: storedPath,
      tipoDocumento: dto.tipoDocumento,
      mimeType: detected.mimeType,
      sizeBytes: file.size,
      originalName: file.originalname,
    };
  }

  private async assertVerifiedSession(sessionToken: string): Promise<void> {
    let rawSession: string | null;
    try {
      rawSession = await redisClient.get(registrationSessionKey(sessionToken));
    } catch (error) {
      this.logger.error(`No se pudo consultar la sesion de registro: ${(error as Error).message}`);
      throw new ServiceUnavailableException(DOCUMENT_MESSAGES.sessionUnavailable);
    }

    if (!rawSession) {
      throw new GoneException({ statusCode: 410, message: DOCUMENT_MESSAGES.sessionExpired });
    }

    let isEmailVerified = false;
    try {
      isEmailVerified = (JSON.parse(rawSession) as { isEmailVerified?: boolean }).isEmailVerified === true;
    } catch {
      isEmailVerified = false;
    }

    if (!isEmailVerified) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: DOCUMENT_MESSAGES.emailNotVerified,
      });
    }
  }
}
