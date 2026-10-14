import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from '../services/documents.service';
import { UploadDocumentDto } from '../contracts/dto';
import { UploadedDocumentFile } from '../contracts/uploaded-document-file';
import { DOCUMENT_FILE_FIELD, MAX_DOCUMENT_SIZE_BYTES } from '../contracts/document.constants';
import { validationExceptionFactory } from '../contracts/validation-exception.factory';
import { DocumentsExceptionFilter } from './documents-exception.filter';

@Controller('documents')
@UseFilters(DocumentsExceptionFilter)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Recibe multipart/form-data: sessionToken, tipoDocumento y el archivo en el campo "archivo".
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor(DOCUMENT_FILE_FIELD, {
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES, files: 1 },
    }),
  )
  async uploadDocument(
    @UploadedFile() archivo: UploadedDocumentFile | undefined,
    @Body(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationExceptionFactory,
      }),
    )
    dto: UploadDocumentDto,
  ) {
    const result = await this.documentsService.uploadDocument(dto, archivo);
    return { data: result };
  }
}
