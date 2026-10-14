import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { DOCUMENT_MESSAGES, DOCUMENT_TYPES } from '../document.constants';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Campos de texto del formulario multipart; el archivo llega aparte en el campo "archivo".
export class UploadDocumentDto {
  @Transform(trim)
  @IsNotEmpty({ message: DOCUMENT_MESSAGES.invalidSession })
  @IsUUID('all', { message: DOCUMENT_MESSAGES.invalidSession })
  sessionToken!: string;

  @Transform(trim)
  @IsNotEmpty({ message: DOCUMENT_MESSAGES.missingType })
  @IsIn(DOCUMENT_TYPES, { message: DOCUMENT_MESSAGES.missingType })
  tipoDocumento!: (typeof DOCUMENT_TYPES)[number];
}
