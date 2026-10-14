import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateJobPostingDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La modalidad es obligatoria' })
  @IsIn(['PRESENCIAL', 'HIBRIDO', 'REMOTO'], {
    message: 'La modalidad debe ser PRESENCIAL, HIBRIDO o REMOTO',
  })
  modalidad: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty({ message: 'El nivel de experiencia es obligatorio' })
  nivelExperiencia: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty({ message: 'La descripción técnica es obligatoria' })
  @MinLength(50, {
    message: 'La descripción técnica debe tener al menos 50 caracteres',
  })
  descripcionTecnica: string;
}
