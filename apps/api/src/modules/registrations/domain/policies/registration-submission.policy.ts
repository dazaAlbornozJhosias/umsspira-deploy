
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { SubmitRegistrationInput } from '../../application/contracts/registration-inputs';

interface StoredSubmission {
  desea_mentor: boolean | null;
  fecha_titulacion: Date | null;
  fecha_ingreso: Date | null;
}

interface StoredDocument {
  id: string;
  tipo_documento: string;
  size_bytes: number;
  mime: string;
}

/**
 * Comprueba que un reintento corresponda exactamente
 * a la entrega que ya fue registrada.
 */
export function assertSameSubmission(
  input: SubmitRegistrationInput,
  stored: StoredSubmission,
  file: StoredDocument | null,
): void {
  const sameDocument =
    file !== null &&
    file.id === input.rutaStorage &&
    file.tipo_documento === input.tipoDocumento &&
    file.size_bytes === input.sizeBytes &&
    (!input.mimeType || file.mime === input.mimeType);

  const sameMentor =
    stored.desea_mentor === input.deseaMentor;

  const sameGraduationDate =
    toDateOnly(stored.fecha_titulacion) ===
    (input.fechaTitulacion ?? null);

  const sameAdmissionDate =
    toDateOnly(stored.fecha_ingreso) ===
    (input.fechaIngreso ?? null);

  if (
    !sameDocument ||
    !sameMentor ||
    !sameGraduationDate ||
    !sameAdmissionDate
  ) {
    throw new BusinessRuleError(
      'conflict',
      'SUBMISSION_ALREADY_COMPLETED',
      'Este registro ya fue entregado con datos diferentes',
    );
  }
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
