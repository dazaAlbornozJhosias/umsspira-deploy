import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import type { CrearFormacionAcademicaDto as CrearFormacionAcademicaContrato } from '@umsspira/shared-types';
import { AnioNoFuturo } from '../validators/anio-no-futuro.validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CrearFormacionAcademicaDto implements CrearFormacionAcademicaContrato {
  @Transform(recortar)
  @IsString({ message: 'La institución debe ser texto' })
  @IsNotEmpty({ message: 'La institución es obligatoria' })
  @MaxLength(150, { message: 'La institución no puede superar los 150 caracteres' })
  institucion: string;

  @Transform(recortar)
  @IsString({ message: 'El título debe ser texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
  titulo: string;

  @Transform(recortar)
  @MaxLength(50, { message: 'El grado no puede superar los 50 caracteres' })
  @IsString({ message: 'El grado debe ser texto' })
  @IsNotEmpty({ message: 'El grado es obligatorio' })
  grado: string;

  @IsNotEmpty({ message: 'El año de egreso es obligatorio' })
  @IsInt({ message: 'El año de egreso debe ser un número entero' })
  @Min(1000, { message: 'El año de egreso debe tener 4 dígitos' })
  @AnioNoFuturo({ message: 'El año de egreso no puede ser mayor al año actual' })
  anioEgreso: number;
}