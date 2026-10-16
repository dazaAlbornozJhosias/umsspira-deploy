import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CrearExperienciaLaboralDto as CrearExperienciaLaboralContrato } from '@umsspira/shared-types';
import {
  FECHA_MINIMA_EXPERIENCIA,
  FechaNoAnteriorA,
  FechaNoFutura,
  NoAnteriorA,
} from '../validators/rango-fechas.validator';

const recortar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CrearExperienciaLaboralDto implements CrearExperienciaLaboralContrato {
  @Transform(recortar)
  @IsString({ message: 'La empresa debe ser texto' })
  @IsNotEmpty({ message: 'La empresa es obligatoria' })
  @MaxLength(150, { message: 'La empresa no puede superar los 150 caracteres' })
  empresa: string;

  @Transform(recortar)
  @IsString({ message: 'El cargo debe ser texto' })
  @IsNotEmpty({ message: 'El cargo es obligatorio' })
  @MaxLength(100, { message: 'El cargo no puede superar los 100 caracteres' })
  cargo: string;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({ strict: true }, { message: 'La fecha de inicio debe tener formato AAAA-MM-DD' })
  @FechaNoFutura({ message: 'La fecha de inicio no puede ser posterior a hoy' })
  @FechaNoAnteriorA(FECHA_MINIMA_EXPERIENCIA, { message: 'La fecha de inicio no puede ser anterior a 1950' })
  fechaInicio: string;

  // Si no se envía, se considera trabajo actual
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha de fin debe tener formato AAAA-MM-DD' })
  @FechaNoFutura({ message: 'La fecha de fin no puede ser posterior a hoy' })
  @FechaNoAnteriorA(FECHA_MINIMA_EXPERIENCIA, { message: 'La fecha de fin no puede ser anterior a 1950' })
  @NoAnteriorA('fechaInicio', { message: 'La fecha de fin no puede ser anterior a la fecha de inicio' })
  fechaFin?: string;
}
