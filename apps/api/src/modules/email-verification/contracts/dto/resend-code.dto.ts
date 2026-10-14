import { IsUUID } from 'class-validator';
import type { ResendCodeInput } from '@umsspira/shared-types';

export class ResendCodeDto implements ResendCodeInput {
  @IsUUID(undefined, { message: 'El identificador del registro no es válido' })
  registrationId!: string;
}