import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

/**
 * HU-03: catálogo controlado (regla 6): el body solo lleva IDs de `area`,
 * nunca texto libre de intereses.
 */
export class AddInterestsDto {
  /** Regla 6: solo IDs (UUID de la fila `area` que representa el interés). */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];
}
