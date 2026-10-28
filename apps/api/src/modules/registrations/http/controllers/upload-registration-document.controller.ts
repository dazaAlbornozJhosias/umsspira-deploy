import type { UploadRegistrationDocumentInput } from '../../application/contracts/registration-inputs';
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { UploadRegistrationDocumentUseCase } from '../../application/use-cases/upload-registration-document.use-case';
import type { UploadedDocument } from '../../application/contracts/registration-inputs';
import { MAX_FILE_BYTES } from '../../domain/policies/registration.policy';
import { uploadDocumentSchema } from '../schemas/registrations.schemas';
import { PublicRegistration } from '../decorators/public-registration.decorator';

@Controller('documents')
export class UploadRegistrationDocumentController {
  constructor(private readonly useCase: UploadRegistrationDocumentUseCase) {}

  @Post()
  @PublicRegistration()
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 2, fieldSize: 256 },
    }),
  )
  async handle(
    @Body(new ZodValidationPipe(uploadDocumentSchema))
    body: UploadRegistrationDocumentInput,
    @UploadedFile() file?: UploadedDocument,
  ) {
    return { data: await this.useCase.execute(body.sessionToken, body.tipoDocumento, file) };
  }
}
