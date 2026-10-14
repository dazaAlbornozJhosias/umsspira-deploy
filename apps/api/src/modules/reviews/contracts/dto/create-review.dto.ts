import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export const REVIEW_DECISIONS = ["APPROVED", "OBSERVED", "REJECTED"] as const;
export type ReviewDecisionValue = (typeof REVIEW_DECISIONS)[number];

export const MIN_NOTE_LENGTH = 10;
export const MAX_NOTE_LENGTH = 500;

// La categoría y la nota solo son obligatorias al observar o rechazar
const requiresJustification = (o: CreateReviewDto) =>
  o.decision === "OBSERVED" || o.decision === "REJECTED";

// Quita espacios al inicio y al final antes de validar
const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateReviewDto {
  @IsIn(REVIEW_DECISIONS, {
    message: "La decisión debe ser APPROVED, OBSERVED o REJECTED.",
  })
  decision!: ReviewDecisionValue;

  @ValidateIf(requiresJustification)
  @Transform(trim)
  @IsString({ message: "La categoría es obligatoria." })
  @IsNotEmpty({ message: "La categoría es obligatoria." })
  category?: string;

  @ValidateIf(requiresJustification)
  @Transform(trim)
  @IsString({ message: "La justificación es obligatoria." })
  @MinLength(MIN_NOTE_LENGTH, {
    message: `La justificación debe tener al menos ${MIN_NOTE_LENGTH} caracteres.`,
  })
  @MaxLength(MAX_NOTE_LENGTH, {
    message: `La justificación no puede superar ${MAX_NOTE_LENGTH} caracteres.`,
  })
  note?: string;

  @IsOptional()
  @IsBoolean()
  notifyDean?: boolean;
}