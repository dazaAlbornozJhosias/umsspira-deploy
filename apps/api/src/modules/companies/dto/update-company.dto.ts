import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO para actualizar el perfil corporativo (HU-04).
 * El NIT/RUC NO esta incluido: es inmutable (forbidNonWhitelisted lo rechaza con 400).
 * Todos los campos son opcionales, pero si se envian no pueden quedar vacios (CA3, CA8).
 */
export class UpdateCompanyDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacio' })
  @MaxLength(100)
  razonSocial?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  eslogan?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La descripcion no puede estar vacia' })
  @MaxLength(2000)
  descripcionLarga?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(45)
  tamanoEmpresa?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(45, { message: 'El sitio web no puede superar 45 caracteres' })
  @Matches(/^https?:\/\/[^\s]+\.[^\s]+$/, {
    message: 'El sitio web debe iniciar con http:// o https:// y no contener espacios',
  })
  sitioWeb?: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Correo invalido' })
  correo?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'Telefono invalido' })
  telefono?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La direccion no puede estar vacia' })
  @MaxLength(255)
  direccion?: string;
}