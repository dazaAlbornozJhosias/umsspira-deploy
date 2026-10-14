import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DOCUMENT_FILE_FIELD,
  DOCUMENT_MESSAGES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../contracts/document.constants';
import { UploadedDocumentFile } from '../contracts/uploaded-document-file';

export type AllowedMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

export interface DetectedFileType {
  mimeType: AllowedMimeType;
  extension: 'pdf' | 'png' | 'jpg';
}

// Firmas binarias ("numeros magicos") del inicio de cada formato permitido.
const FILE_SIGNATURES: { type: DetectedFileType; bytes: number[] }[] = [
  { type: { mimeType: 'application/pdf', extension: 'pdf' }, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
  {
    type: { mimeType: 'image/png', extension: 'png' },
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { type: { mimeType: 'image/jpeg', extension: 'jpg' }, bytes: [0xff, 0xd8, 0xff] },
];

// Extensiones aceptadas y el tipo real que deben tener.
const EXTENSION_TO_MIME: Record<string, AllowedMimeType> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Valida el documento de respaldo en el servidor (CA-03.3): tamano maximo de 5 MB,
 * extension permitida y contenido real PDF, PNG o JPG segun su firma binaria.
 * No confia en el tipo MIME enviado por el navegador porque puede ser falsificado.
 */
@Injectable()
export class FileValidatorService {
  validate(file: UploadedDocumentFile): DetectedFileType {
    if (!file.buffer || file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
      this.reject();
    }

    const extension = this.getExtension(file.originalname);
    const expectedMime = extension ? EXTENSION_TO_MIME[extension] : undefined;
    const detected = this.detectType(file.buffer);

    if (!expectedMime || !detected || detected.mimeType !== expectedMime) {
      this.reject();
    }

    return detected;
  }

  detectType(content: Buffer): DetectedFileType | null {
    const match = FILE_SIGNATURES.find(({ bytes }) =>
      bytes.every((byte, index) => content.length > index && content[index] === byte),
    );
    return match ? match.type : null;
  }

  private getExtension(fileName: string): string | null {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex === fileName.length - 1) return null;
    return fileName.slice(dotIndex + 1).toLowerCase();
  }

  private reject(): never {
    throw new BadRequestException({
      statusCode: 400,
      message: DOCUMENT_MESSAGES.invalidFile,
      errors: [{ field: DOCUMENT_FILE_FIELD, message: DOCUMENT_MESSAGES.invalidFile }],
    });
  }
}
