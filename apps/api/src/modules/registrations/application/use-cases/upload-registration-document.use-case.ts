import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { validateDocument } from '../../domain/policies/document.policy';
import { assertVerifiedDraft } from '../../domain/policies/registration.policy';
import type { UploadedDocument } from '../contracts/registration-inputs';
import type { RegistrationRepository } from '../ports/registration-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

export class UploadRegistrationDocumentUseCase {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly security: RegistrationSecurity,
  ) {}

  async execute(token: string, documentType: string, file?: UploadedDocument) {
    const hash = this.security.hash('draft', token);
    assertVerifiedDraft(await this.repository.findDraft(hash));
    if (!file) {
      throw new BusinessRuleError(
        'invalid',
        'DOCUMENT_REQUIRED',
        'Adjunta un documento de respaldo',
      );
    }
    const mime = validateDocument(file.originalname, file.buffer);
    const id = this.security.token();
    const name = file.originalname
      .replaceAll('\\', '/')
      .split('/')
      .pop()!
      .replace(/[\x00-\x1f\x7f]/g, '')
      .slice(0, 255);
    await this.repository.saveFile(hash, {
      id,
      documentType,
      name,
      mime,
      bytes: file.buffer,
      size: file.buffer.length,
    });
    return {
      path: id,
      tipoDocumento: documentType,
      mimeType: mime,
      sizeBytes: file.buffer.length,
      originalName: name,
    };
  }
}
