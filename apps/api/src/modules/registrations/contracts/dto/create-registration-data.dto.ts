import { Transform } from 'class-transformer';
import {
  IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min,
} from 'class-validator';

export const EXPEDITION_DEPARTMENTS = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD', 'EX'] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const REQUIRED = { message: 'Campo obligatorio' };
const NAME_MSG = "2 a 45 caracteres: solo letras, espacios, tildes, apóstrofe y guion";

export class CreateRegistrationDataDto {
  @Transform(trim) @IsNotEmpty(REQUIRED) @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ' -]{2,45}$/, { message: NAME_MSG })
  nombres!: string;

  @Transform(trim) @IsNotEmpty(REQUIRED) @IsString()
  @Matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ' -]{2,45}$/, { message: NAME_MSG })
  apellidos!: string;

  @Transform(trim) @IsNotEmpty(REQUIRED) @IsString()
  @Matches(/^\d{5,10}$/, { message: 'Debe tener entre 5 y 10 dígitos, sin puntos ni guiones' })
  ci!: string;

  @IsOptional() @Transform(trimUpper) @IsString()
  @Matches(/^[A-Za-z0-9]{0,2}$/, { message: 'Máximo 2 caracteres alfanuméricos' })
  complementoCi?: string;

  @IsNotEmpty(REQUIRED)
  @IsIn(EXPEDITION_DEPARTMENTS, { message: 'Selecciona un departamento válido' })
  expedidoEn!: (typeof EXPEDITION_DEPARTMENTS)[number];

  @Transform(trimLower) @IsNotEmpty(REQUIRED)
  @IsEmail({}, { message: 'Correo no válido' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  correo!: string;

  @Transform(trim) @IsNotEmpty(REQUIRED) @IsString()
  @Matches(/^\d{8}$/, { message: 'Debe tener 8 dígitos' })
  telefono!: string;

  @IsNotEmpty(REQUIRED) @IsString()
  carreraId!: string;

  @IsNotEmpty(REQUIRED)
  @IsInt({ message: 'Año no válido' })
  @Min(1970, { message: 'El año debe ser 1970 o posterior' })
  @Max(new Date().getFullYear(), { message: `El año no puede ser mayor a ${new Date().getFullYear()}` })
  anioEgreso!: number;

  @Transform(trim) @IsNotEmpty(REQUIRED) @IsString()
  @Matches(/^\d{6,9}$/, { message: 'Código SIS de 6 a 9 dígitos' })
  codigoSis!: string;
}
