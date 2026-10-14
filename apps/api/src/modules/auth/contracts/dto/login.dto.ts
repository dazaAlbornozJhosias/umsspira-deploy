// apps/api/src/modules/auth/contracts/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { LoginInput } from '@umsspira/shared-types';

export class LoginDto implements LoginInput {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}