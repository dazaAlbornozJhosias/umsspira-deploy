import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import type {
  EventStatus,
  CreateEventDto as CreateEventContract,
} from '@umsspira/shared-types';

const CREATE_ALLOWED_STATUSES = [
  'BORRADOR',
  'PUBLICADO',
] as const;

export class CreateEventDto implements CreateEventContract {
  @IsNotEmpty({
    message: 'El título es obligatorio',
  })
  @IsString({
    message: 'El título debe ser texto',
  })
  @MaxLength(45, {
    message: 'El título no puede superar los 45 caracteres',
  })
  title: string;

  @IsOptional()
  @IsString({
    message: 'La descripción debe ser texto',
  })
  description?: string;

  @IsISO8601(
    { strict: true },
    {
      message: 'La fecha de inicio debe ser una fecha válida',
    },
  )
  startDate: string;

  @IsISO8601(
    { strict: true },
    {
      message: 'La fecha de finalización debe ser una fecha válida',
    },
  )
  endDate: string;

  @IsInt({
    message: 'El cupo máximo debe ser un número entero',
  })
  @Min(1, {
    message: 'El cupo máximo debe ser mayor a 0',
  })
  maxCapacity: number;

  @IsOptional()
  @IsString({
    message: 'La ubicación debe ser texto',
  })
  @MaxLength(100, {
    message: 'La ubicación no puede superar los 100 caracteres',
  })
  location?: string;

  @IsOptional()
  @IsIn(CREATE_ALLOWED_STATUSES, {
    message: 'El estado debe ser BORRADOR o PUBLICADO',
  })
  status?: Extract<
    EventStatus,
    'BORRADOR' | 'PUBLICADO'
  >;
}