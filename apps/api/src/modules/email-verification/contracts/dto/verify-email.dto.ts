import { IsString, IsUUID, Matches } from 'class-validator';
import type { VerifyEmailInput } from '@umsspira/shared-types';
import { CODE_LENGTH } from '../../email-verification.constants';

const CODE_PATTERN = new RegExp(`^\\d{${CODE_LENGTH}}$`);

export class VerifyEmailDto implements VerifyEmailInput {
  @IsUUID(undefined, { message: 'El identificador del registro no es válido' })
  registrationId!: string;

  @IsString({ message: 'El código es obligatorio' })
  @Matches(CODE_PATTERN, {
    message: `El código debe tener ${CODE_LENGTH} dígitos numéricos`,
  })
  code!: string;
}
