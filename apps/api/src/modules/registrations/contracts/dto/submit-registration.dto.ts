import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SubmitRegistrationDto {
  @Transform(trim)
  @IsNotEmpty()
  @IsUUID()
  sessionToken!: string;

  @Transform(trim)
  @IsOptional()
  @IsDateString()
  fechaTitulacion?: string;

  @Transform(trim)
  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsBoolean()
  deseaMentor!: boolean;

  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  tipoDocumento!: string;

  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  rutaStorage!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  mimeType?: string;
}