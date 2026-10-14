import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { FileValidatorService } from './services/file-validator.service';
import { DocumentsRepository } from './repositories/documents.repository';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, FileValidatorService, DocumentsRepository],
  exports: [DocumentsService, FileValidatorService],
})
export class DocumentsModule {}
