import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { EducationRecord } from '../entities/profile-record';

export function assertUniqueEducation(
  input: { institucion: string; titulo: string; anioEgreso: number },
  records: EducationRecord[],
  excludedId?: string,
): void {
  const normalized = (value: string) => value.trim().toLowerCase();
  if (
    records.some(
      (row) =>
        row.id !== excludedId &&
        normalized(row.institution) === normalized(input.institucion) &&
        normalized(row.title) === normalized(input.titulo) &&
        row.graduationYear === input.anioEgreso,
    )
  ) {
    throw new BusinessRuleError(
      'conflict',
      'EDUCATION_EXISTS',
      'La formación académica ya se encuentra registrada',
    );
  }
}
